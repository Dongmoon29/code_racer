package service

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/factory"
	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/judge"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/types"
)

type judgeService struct {
	codeWrapper       interfaces.CodeWrapper
	judge0Client      interfaces.Judge0Client
	logger            logger.Logger
	functionExtractor *judge.FunctionExtractor
}

// 인터페이스 구현 확인
var _ interfaces.JudgeService = (*judgeService)(nil)

func NewJudgeService(apiKey string, apiEndpoint string, logger logger.Logger) interfaces.JudgeService {
	return &judgeService{
		codeWrapper:       factory.NewCodeWrapper(logger),
		judge0Client:      factory.NewJudge0Client(apiKey, apiEndpoint),
		logger:            logger,
		functionExtractor: judge.NewFunctionExtractor(logger),
	}
}

func (s *judgeService) EvaluateCode(code string, language string, problem *model.LeetCode) (*types.EvaluationResult, error) {
	if err := s.ensureFunctionNameMatches(code, language, problem.FunctionName); err != nil {
		return nil, err
	}

	languageID, err := s.getLanguageID(language)
	if err != nil {
		return nil, fmt.Errorf("failed to get language ID: %w", err)
	}

	if res, ok, err := s.tryBatchEvaluate(code, languageID, problem); err != nil {
		return nil, err
	} else if ok {
		// 운영 관측: 배치 경로 사용 로깅
		passCount := 0
		for _, tr := range res.TestResults {
			if tr.Passed {
				passCount++
			}
		}
		compileTimeout, runTimeout, memoryLimit := s.deriveLimits(problem)
		s.logger.Info().
			Str("mode", "batch").
			Int("languageID", languageID).
			Int("testCases", len(res.TestResults)).
			Int("passCount", passCount).
			Bool("passed", res.Passed).
			Float64("avgTime", res.ExecutionTime).
			Float64("avgMemory", res.MemoryUsage).
			Int("compileTimeout", compileTimeout).
			Int("runTimeout", runTimeout).
			Int("memoryLimitKB", memoryLimit).
			Msg("Evaluation summary")
		return res, nil
	}

	res, err := s.aggregatePerTest(code, languageID, problem)
	if err == nil && res != nil {
		// 운영 관측: 폴백 경로 로깅
		passCount := 0
		for _, tr := range res.TestResults {
			if tr.Passed {
				passCount++
			}
		}
		compileTimeout, runTimeout, memoryLimit := s.deriveLimits(problem)
		s.logger.Info().
			Str("mode", "per_test").
			Int("languageID", languageID).
			Int("testCases", len(res.TestResults)).
			Int("passCount", passCount).
			Bool("passed", res.Passed).
			Float64("avgTime", res.ExecutionTime).
			Float64("avgMemory", res.MemoryUsage).
			Int("compileTimeout", compileTimeout).
			Int("runTimeout", runTimeout).
			Int("memoryLimitKB", memoryLimit).
			Msg("Evaluation summary")
	}
	return res, err
}

// ensureFunctionNameMatches extracts and validates the function name (strict mode)
func (s *judgeService) ensureFunctionNameMatches(code string, language string, expected string) error {
	submittedFunctionName, err := s.functionExtractor.ExtractFunctionName(code, language)
	if err != nil {
		return fmt.Errorf("failed to extract function name: %w", err)
	}
	if submittedFunctionName != expected {
		return fmt.Errorf("function name mismatch: submitted '%s', expected '%s'", submittedFunctionName, expected)
	}
	s.logger.Debug().Str("submittedFunctionName", submittedFunctionName).Str("problemFunctionName", expected)
	return nil
}

// tryBatchEvaluate attempts batch harness path; returns (result, usedBatch, error)
func (s *judgeService) tryBatchEvaluate(code string, languageID int, problem *model.LeetCode) (*types.EvaluationResult, bool, error) {
	// build inputs
	inputs := make([][]interface{}, 0, len(problem.TestCases))
	expected := make([]interface{}, 0, len(problem.TestCases))
	for _, tc := range problem.TestCases {
		inputs = append(inputs, tc.Input)
		expected = append(expected, tc.Output)
	}
	inputsJSON, _ := json.Marshal(inputs)

	// wrap batch (may fail for unsupported languages)
	wrappedCode, err := s.codeWrapper.WrapCodeBatch(code, languageID, string(inputsJSON), problem)
	if err != nil {
		return nil, false, nil
	}

	// submit
	expectedJSON, _ := json.Marshal(expected)
	resp, err := s.submitToJudge(wrappedCode, languageID, string(expectedJSON), problem)
	if err != nil {
		return nil, false, err
	}

	// evaluate response
	res, err := s.evaluateBatchResponse(resp, expected, inputs)
	if err != nil {
		return nil, false, nil // fall back on parse errors
	}
	return res, true, nil
}

func (s *judgeService) submitToJudge(wrappedCode string, languageID int, expectedJSON string, problem *model.LeetCode) (*types.Judge0Response, error) {
	compileTimeout, runTimeout, memoryLimit := s.deriveLimits(problem)
	request := types.Judge0Request{
		SourceCode:       wrappedCode,
		LanguageID:       languageID,
		ExpectedOutput:   expectedJSON,
		CompileTimeout:   compileTimeout,
		RunTimeout:       runTimeout,
		MemoryLimit:      memoryLimit,
		EnableNetworking: false,
	}
	response, err := s.judge0Client.SubmitCode(request)
	if err != nil {
		// 쿼터 초과 식별 로깅
		errMsg := fmt.Errorf("Judge0 API error: %w", err)
		if strings.Contains(errMsg.Error(), "exceeded the DAILY quota") {
			s.logger.Error().
				Str("error_type", "judge0_quota_exceeded").
				Int("languageID", languageID).
				Msg("Judge0 quota exceeded")
		}
		return nil, errMsg
	}
	return response, nil
}

// deriveLimits converts model constraints to Judge0 limits
func (s *judgeService) deriveLimits(problem *model.LeetCode) (compileTimeout int, runTimeout int, memoryLimit int) {
	// Assume model.TimeLimit is in milliseconds and MemoryLimit in MB
	// Compile timeout: 2x runTimeout cap, runTimeout from TimeLimit
	run := problem.TimeLimit / 1000
	if run <= 0 {
		run = 5
	}
	comp := run * 2
	mem := problem.MemoryLimit * 1000 // MB -> KB expected by Judge0 (uses kB)
	if mem <= 0 {
		mem = 128000
	}
	return comp, run, mem
}

func (s *judgeService) evaluateBatchResponse(response *types.Judge0Response, expected []interface{}, inputs [][]interface{}) (*types.EvaluationResult, error) {
	if response.CompileError != "" {
		return &types.EvaluationResult{Passed: false, ErrorMessage: fmt.Sprintf("Compilation error: %s", response.CompileError)}, nil
	}
	if response.Stderr != "" {
		return &types.EvaluationResult{Passed: false, ErrorMessage: fmt.Sprintf("Runtime error: %s", response.Stderr)}, nil
	}
	actualTrimmed := strings.TrimSpace(response.Stdout)
	var actual []interface{}
	if err := json.Unmarshal([]byte(actualTrimmed), &actual); err != nil {
		return nil, fmt.Errorf("invalid runner output: %v", err)
	}

	var results []types.TestCaseResult
	allPassed := true
	for i := range expected {
		expBytes, _ := json.Marshal(expected[i])
		actBytes, _ := json.Marshal(actual[i])
		tr := types.TestCaseResult{
			TestCaseIndex: i,
			Input:         string(mustJSON(inputs[i])),
			Expected:      string(expBytes),
			Actual:        strings.TrimSpace(string(actBytes)),
			Passed:        strings.TrimSpace(string(actBytes)) == strings.TrimSpace(string(expBytes)),
			ExecutionTime: getFloat64Time(response.Time),
			MemoryUsage:   response.Memory,
		}
		if !tr.Passed {
			allPassed = false
		}
		results = append(results, tr)
	}
	return &types.EvaluationResult{
		Passed:        allPassed,
		TestResults:   results,
		ExecutionTime: getFloat64Time(response.Time),
		MemoryUsage:   response.Memory,
	}, nil
}

func (s *judgeService) aggregatePerTest(code string, languageID int, problem *model.LeetCode) (*types.EvaluationResult, error) {
	var testResults []types.TestCaseResult
	var totalTime float64
	var totalMemory float64
	allPassed := true
	for i, testCase := range problem.TestCases {
		result := s.evaluateTestCase(code, languageID, testCase, problem, i)
		testResults = append(testResults, *result)
		if !result.Passed {
			allPassed = false
		}
		totalTime += result.ExecutionTime
		totalMemory += result.MemoryUsage
	}
	testCount := float64(len(problem.TestCases))
	avgTime := totalTime / testCount
	avgMemory := totalMemory / testCount
	return &types.EvaluationResult{
		Passed:        allPassed,
		TestResults:   testResults,
		ExecutionTime: avgTime,
		MemoryUsage:   avgMemory,
	}, nil
}

func (s *judgeService) WrapCodeWithTestCase(code string, languageID int, testCase string, problem *model.LeetCode) (string, error) {
	return s.codeWrapper.WrapCode(code, languageID, testCase, problem)
}

// getLanguageID는 문자열 언어 이름을 Judge0 API의 언어 ID로 변환합니다
func (s *judgeService) getLanguageID(language string) (int, error) {
	switch strings.ToLower(language) {
	case "javascript":
		return constants.LanguageIDJavaScript, nil
	case "python":
		return constants.LanguageIDPython, nil
	case "java":
		return constants.LanguageIDJava, nil
	case "cpp":
		return constants.LanguageIDCPP, nil
	case "go":
		return constants.LanguageIDGo, nil
	case "rust":
		return constants.LanguageIDRust, nil
	default:
		return 0, fmt.Errorf("unsupported programming language: %s", language)
	}
}

// evaluateTestCase는 단일 테스트 케이스에 대해 코드를 평가합니다
func (s *judgeService) evaluateTestCase(
	// user code
	code string,
	languageID int,
	testCase model.TestCase,
	problem *model.LeetCode,
	index int,
) *types.TestCaseResult {
	s.logger.Debug().
		Int("testCaseIndex", index).
		Interface("testCase", testCase).
		Msg("Starting test case evaluation")

	wrapped, expectedStr, early := s.buildSingleWrappedCode(code, languageID, testCase, problem, index)
	if early != nil {
		return early
	}

	response, early := s.submitSingle(wrapped, languageID, expectedStr, index, problem)
	if early != nil {
		return early
	}

	return s.evaluateSingleResponse(response, testCase, expectedStr, index)
}

func (s *judgeService) buildSingleWrappedCode(code string, languageID int, testCase model.TestCase, problem *model.LeetCode, index int) (string, string, *types.TestCaseResult) {
	testCaseJSON, err := json.Marshal(testCase.Input)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to marshal test case input")
		return "", "", &types.TestCaseResult{TestCaseIndex: index, Passed: false, ErrorMessage: fmt.Sprintf("Failed to marshal test case: %v", err)}
	}
	expectedJSON, err := json.Marshal(testCase.Output)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to marshal expected output")
		return "", "", &types.TestCaseResult{TestCaseIndex: index, Passed: false, ErrorMessage: fmt.Sprintf("Failed to marshal expected output: %v", err)}
	}
	wrappedCode, err := s.codeWrapper.WrapCode(code, languageID, string(testCaseJSON), problem)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to wrap code")
		return "", "", &types.TestCaseResult{TestCaseIndex: index, Passed: false, ErrorMessage: fmt.Sprintf("Failed to wrap code: %v", err)}
	}
	s.logger.Debug().Int("testCaseIndex", index).Str("wrappedCode", wrappedCode).Msg("Code wrapped successfully")
	return wrappedCode, string(expectedJSON), nil
}

func (s *judgeService) submitSingle(wrappedCode string, languageID int, expectedJSON string, index int, problem *model.LeetCode) (*types.Judge0Response, *types.TestCaseResult) {
	compileTimeout, runTimeout, memoryLimit := s.deriveLimits(problem)
	request := types.Judge0Request{
		SourceCode:       wrappedCode,
		LanguageID:       languageID,
		ExpectedOutput:   expectedJSON,
		CompileTimeout:   compileTimeout,
		RunTimeout:       runTimeout,
		MemoryLimit:      memoryLimit,
		EnableNetworking: false,
	}
	response, err := s.judge0Client.SubmitCode(request)
	if err != nil {
		s.logger.Error().Err(err).Msg("Judge0 API request failed")
		return nil, &types.TestCaseResult{TestCaseIndex: index, Passed: false, ErrorMessage: fmt.Sprintf("Judge0 API error: %v", err)}
	}
	s.logger.Debug().Int("testCaseIndex", index).Interface("response", response).Msg("Received Judge0 API response")
	return response, nil
}

func (s *judgeService) evaluateSingleResponse(response *types.Judge0Response, testCase model.TestCase, expectedJSON string, index int) *types.TestCaseResult {
	inputJSON, _ := json.Marshal(testCase.Input)
	result := &types.TestCaseResult{
		TestCaseIndex: index,
		Input:         string(inputJSON),
		Expected:      expectedJSON,
		ExecutionTime: getFloat64Time(response.Time),
		MemoryUsage:   response.Memory,
	}
	if response.CompileError != "" {
		s.logger.Error().Str("compileError", response.CompileError).Msg("Compilation error occurred")
		result.Passed = false
		result.ErrorMessage = fmt.Sprintf("Compilation error: %s", response.CompileError)
		return result
	}
	if response.Stderr != "" {
		s.logger.Error().Str("stderr", response.Stderr).Msg("Runtime error occurred")
		result.Passed = false
		result.ErrorMessage = fmt.Sprintf("Runtime error: %s", response.Stderr)
		return result
	}
	result.Actual = strings.TrimSpace(response.Stdout)
	result.Passed = strings.TrimSpace(result.Actual) == strings.TrimSpace(result.Expected)
	s.logger.Debug().Int("testCaseIndex", index).Bool("passed", result.Passed).Str("actual", result.Actual).Str("expected", result.Expected).Float64("executionTime", result.ExecutionTime).Float64("memoryUsage", result.MemoryUsage).Msg("Test case evaluation completed")
	return result
}

func getFloat64Time(timeValue interface{}) float64 {
	switch v := timeValue.(type) {
	case float64:
		return v
	case float32:
		return float64(v)
	case int:
		return float64(v)
	case int64:
		return float64(v)
	default:
		return 0
	}
}

// mustJSON marshals value to JSON string or returns fallback
func mustJSON(v interface{}) []byte {
	b, err := json.Marshal(v)
	if err != nil {
		return []byte("null")
	}
	return b
}
