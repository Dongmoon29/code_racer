package service

import (
	"encoding/json"
	"fmt"
	"regexp"
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
	// 제출된 코드에서 함수 이름 추출
	submittedFunctionName, err := s.functionExtractor.ExtractFunctionName(code, language)
	if err != nil {
		return nil, fmt.Errorf("failed to extract function name: %w", err)
	}

	// 함수 이름이 다른 경우 코드 수정
	if submittedFunctionName != problem.FunctionName {
		code = s.replaceFunctionName(code, submittedFunctionName, problem.FunctionName)
	}
	s.logger.Debug().
		Str("submittedFunctionName", submittedFunctionName).
		Str("problemFunctionName", problem.FunctionName)

	// 언어 ID 가져오기
	languageID, err := s.getLanguageID(language)
	if err != nil {
		return nil, fmt.Errorf("failed to get language ID: %w", err)
	}

	// 테스트 케이스 결과 저장
	var testResults []types.TestCaseResult
	var totalTime float64
	var totalMemory float64
	allPassed := true

	// 각 테스트 케이스에 대해 평가 수행
	for i, testCase := range problem.TestCases {
		result := s.evaluateTestCase(code, languageID, testCase, problem, i)
		testResults = append(testResults, *result)

		if !result.Passed {
			allPassed = false
		}

		totalTime += result.ExecutionTime
		totalMemory += result.MemoryUsage
	}

	// 평균 실행 시간과 메모리 사용량 계산
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

	testCaseJSON, err := json.Marshal(testCase.Input)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to marshal test case input")
		return &types.TestCaseResult{
			TestCaseIndex: index,
			Passed:        false,
			ErrorMessage:  fmt.Sprintf("Failed to marshal test case: %v", err),
		}
	}

	expectedJSON, err := json.Marshal(testCase.Output)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to marshal expected output")
		return &types.TestCaseResult{
			TestCaseIndex: index,
			Passed:        false,
			ErrorMessage:  fmt.Sprintf("Failed to marshal expected output: %v", err),
		}
	}

	wrappedCode, err := s.codeWrapper.WrapCode(code, languageID, string(testCaseJSON), problem)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to wrap code")
		return &types.TestCaseResult{
			TestCaseIndex: index,
			Passed:        false,
			ErrorMessage:  fmt.Sprintf("Failed to wrap code: %v", err),
		}
	}

	s.logger.Debug().
		Int("testCaseIndex", index).
		Str("wrappedCode", wrappedCode).
		Msg("Code wrapped successfully")

	request := types.Judge0Request{
		SourceCode:       wrappedCode,
		LanguageID:       languageID,
		ExpectedOutput:   string(expectedJSON),
		CompileTimeout:   10,
		RunTimeout:       5,
		MemoryLimit:      128000,
		EnableNetworking: false,
	}

	response, err := s.judge0Client.SubmitCode(request)
	if err != nil {
		s.logger.Error().Err(err).Msg("Judge0 API request failed")
		return &types.TestCaseResult{
			TestCaseIndex: index,
			Passed:        false,
			ErrorMessage:  fmt.Sprintf("Judge0 API error: %v", err),
		}
	}

	s.logger.Debug().
		Int("testCaseIndex", index).
		Interface("response", response).
		Msg("Received Judge0 API response")

	result := &types.TestCaseResult{
		TestCaseIndex: index,
		Input:         string(testCaseJSON),
		Expected:      string(expectedJSON),
		ExecutionTime: getFloat64Time(response.Time),
		MemoryUsage:   response.Memory,
	}

	if response.CompileError != "" {
		s.logger.Error().
			Str("compileError", response.CompileError).
			Msg("Compilation error occurred")
		result.Passed = false
		result.ErrorMessage = fmt.Sprintf("Compilation error: %s", response.CompileError)
		return result
	}

	if response.Stderr != "" {
		s.logger.Error().
			Str("stderr", response.Stderr).
			Msg("Runtime error occurred")
		result.Passed = false
		result.ErrorMessage = fmt.Sprintf("Runtime error: %s", response.Stderr)
		return result
	}

	result.Actual = strings.TrimSpace(response.Stdout)
	result.Passed = strings.TrimSpace(result.Actual) == strings.TrimSpace(result.Expected)

	s.logger.Debug().
		Int("testCaseIndex", index).
		Bool("passed", result.Passed).
		Str("actual", result.Actual).
		Str("expected", result.Expected).
		Float64("executionTime", result.ExecutionTime).
		Float64("memoryUsage", result.MemoryUsage).
		Msg("Test case evaluation completed")

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

func (s *judgeService) replaceFunctionName(code, oldName, newName string) string {
	// JavaScript: function answer() {} 또는 const/let answer = () => {} 패턴
	jsPattern := fmt.Sprintf(`(function\s+)%s(\s*\()|(\b(?:const|let|var)\s+)%s(\s*=\s*(?:function|\()|\s*=\s*\(.*\)\s*=>)`, oldName, oldName)
	code = regexp.MustCompile(jsPattern).ReplaceAllString(code, "${1}${3}"+newName+"${2}${4}")

	// Python: def answer():
	pythonPattern := fmt.Sprintf(`(def\s+)%s(\s*\()`, oldName)
	code = regexp.MustCompile(pythonPattern).ReplaceAllString(code, "${1}"+newName+"${2}")

	// Go: func answer()
	goPattern := fmt.Sprintf(`(func\s+)%s(\s*\()`, oldName)
	code = regexp.MustCompile(goPattern).ReplaceAllString(code, "${1}"+newName+"${2}")

	return code
}
