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

// Judge service constants
const (
	// Time conversion factors
	judgeMillisecondsToSeconds = 1000
	judgeMegabytesToKilobytes  = 1000

	// Default timeouts
	judgeDefaultRunTimeoutSeconds = 5
	judgeDefaultMemoryLimitKB     = 128000

	// Compile timeout multiplier
	judgeCompileTimeoutMultiplier = 2
)

type judgeService struct {
	codeWrapper       interfaces.CodeWrapper
	judge0Client      interfaces.Judge0Client
	logger            logger.Logger
	functionExtractor *judge.FunctionExtractor
}

// Interface implementation check
var _ interfaces.JudgeService = (*judgeService)(nil)

// NewJudgeService creates a new JudgeService instance with the provided configuration
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

	// Try batch evaluation first
	batchEvaluationResult, batchEvaluationSuccess, batchEvaluationError := s.tryBatchEvaluate(code, languageID, problem)
	if batchEvaluationError != nil {
		return nil, batchEvaluationError
	}

	if batchEvaluationSuccess {
		s.logEvaluationResult(batchEvaluationResult, languageID, problem, "batch")
		return batchEvaluationResult, nil
	}

	// Fallback to per-test evaluation
	perTestEvaluationResult, perTestEvaluationError := s.aggregatePerTest(code, languageID, problem)
	if perTestEvaluationError == nil && perTestEvaluationResult != nil {
		s.logEvaluationResult(perTestEvaluationResult, languageID, problem, "per_test")
	}

	return perTestEvaluationResult, perTestEvaluationError
}

// logEvaluationResult logs the evaluation result with detailed metrics
func (s *judgeService) logEvaluationResult(evaluationResult *types.EvaluationResult, languageID int, problem *model.LeetCode, evaluationMode string) {
	passedTestCount := s.countPassedTests(evaluationResult.TestResults)
	compileTimeoutSeconds, runTimeoutSeconds, memoryLimitKB := s.deriveLimits(problem)

	s.logger.Info().
		Str("mode", evaluationMode).
		Int("languageID", languageID).
		Int("testCases", len(evaluationResult.TestResults)).
		Int("passCount", passedTestCount).
		Bool("passed", evaluationResult.Passed).
		Float64("avgTime", evaluationResult.ExecutionTime).
		Float64("avgMemory", evaluationResult.MemoryUsage).
		Int("compileTimeout", compileTimeoutSeconds).
		Int("runTimeout", runTimeoutSeconds).
		Int("memoryLimitKB", memoryLimitKB).
		Msg("Evaluation summary")
}

// countPassedTests counts the number of passed test cases
func (s *judgeService) countPassedTests(testResults []types.TestCaseResult) int {
	passedTestCount := 0
	for _, testCaseResult := range testResults {
		if testCaseResult.Passed {
			passedTestCount++
		}
	}
	return passedTestCount
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
	testCaseInputs := make([][]interface{}, 0, len(problem.TestCases))
	expectedOutputs := make([]interface{}, 0, len(problem.TestCases))
	for _, testCase := range problem.TestCases {
		testCaseInputs = append(testCaseInputs, testCase.Input)
		expectedOutputs = append(expectedOutputs, testCase.Output)
	}
	inputsJSON, _ := json.Marshal(testCaseInputs)

	// wrap batch (may fail for unsupported languages)
	wrappedCode, err := s.codeWrapper.WrapCodeBatch(code, languageID, string(inputsJSON), problem)
	if err != nil {
		return nil, false, nil
	}

	// submit
	expectedOutputsJSON, _ := json.Marshal(expectedOutputs)
	judgeResponse, err := s.submitToJudge(wrappedCode, languageID, string(expectedOutputsJSON), problem)
	if err != nil {
		return nil, false, err
	}

	// evaluate response
	evaluationResult, err := s.evaluateBatchResponse(judgeResponse, expectedOutputs, testCaseInputs)
	if err != nil {
		return nil, false, nil // fall back on parse errors
	}
	return evaluationResult, true, nil
}

func (s *judgeService) submitToJudge(wrappedCode string, languageID int, expectedOutputsJSON string, problem *model.LeetCode) (*types.Judge0Response, error) {
	compileTimeoutSeconds, runTimeoutSeconds, memoryLimitKB := s.deriveLimits(problem)
	judgeRequest := types.Judge0Request{
		SourceCode:       wrappedCode,
		LanguageID:       languageID,
		ExpectedOutput:   expectedOutputsJSON,
		CompileTimeout:   compileTimeoutSeconds,
		RunTimeout:       runTimeoutSeconds,
		MemoryLimit:      memoryLimitKB,
		EnableNetworking: false,
	}
	judgeResponse, err := s.judge0Client.SubmitCode(judgeRequest)
	if err != nil {
		// Log quota exceeded identification
		errorMessage := fmt.Errorf("Judge0 API error: %w", err)
		if strings.Contains(errorMessage.Error(), "exceeded the DAILY quota") {
			s.logger.Error().
				Str("error_type", "judge0_quota_exceeded").
				Int("languageID", languageID).
				Msg("Judge0 quota exceeded")
		}
		return nil, errorMessage
	}
	return judgeResponse, nil
}

// deriveLimits converts model constraints to Judge0 limits
func (s *judgeService) deriveLimits(problem *model.LeetCode) (compileTimeout int, runTimeout int, memoryLimit int) {
	// Assume model.TimeLimit is in milliseconds and MemoryLimit in MB
	// Compile timeout: 2x runTimeout cap, runTimeout from TimeLimit
	runTimeoutSeconds := problem.TimeLimit / judgeMillisecondsToSeconds
	if runTimeoutSeconds <= 0 {
		runTimeoutSeconds = judgeDefaultRunTimeoutSeconds
	}
	compileTimeoutSeconds := runTimeoutSeconds * judgeCompileTimeoutMultiplier
	memoryLimitKB := problem.MemoryLimit * judgeMegabytesToKilobytes // MB -> KB expected by Judge0 (uses kB)
	if memoryLimitKB <= 0 {
		memoryLimitKB = judgeDefaultMemoryLimitKB
	}
	return compileTimeoutSeconds, runTimeoutSeconds, memoryLimitKB
}

func (s *judgeService) evaluateBatchResponse(response *types.Judge0Response, expected []interface{}, inputs [][]interface{}) (*types.EvaluationResult, error) {
	if s.hasCompilationError(response) {
		return s.createCompilationErrorResult(response), nil
	}

	if s.hasRuntimeError(response) {
		return s.createRuntimeErrorResult(response), nil
	}

	actualResults, err := s.parseActualResults(response.Stdout)
	if err != nil {
		return nil, err
	}

	testResults := s.buildTestResults(expected, inputs, actualResults, response)
	return s.createEvaluationResult(testResults, response), nil
}

// hasCompilationError checks if the response has compilation errors
func (s *judgeService) hasCompilationError(response *types.Judge0Response) bool {
	return response.CompileError != ""
}

// hasRuntimeError checks if the response has runtime errors
func (s *judgeService) hasRuntimeError(response *types.Judge0Response) bool {
	return response.Stderr != ""
}

// createCompilationErrorResult creates an error result for compilation failures
func (s *judgeService) createCompilationErrorResult(response *types.Judge0Response) *types.EvaluationResult {
	return &types.EvaluationResult{
		Passed:       false,
		ErrorMessage: fmt.Sprintf("Compilation error: %s", response.CompileError),
	}
}

// createRuntimeErrorResult creates an error result for runtime failures
func (s *judgeService) createRuntimeErrorResult(response *types.Judge0Response) *types.EvaluationResult {
	return &types.EvaluationResult{
		Passed:       false,
		ErrorMessage: fmt.Sprintf("Runtime error: %s", response.Stderr),
	}
}

// parseActualResults parses the actual results from stdout
func (s *judgeService) parseActualResults(stdout string) ([]interface{}, error) {
	actualTrimmed := strings.TrimSpace(stdout)
	var actual []interface{}
	if err := json.Unmarshal([]byte(actualTrimmed), &actual); err != nil {
		return nil, fmt.Errorf("invalid runner output: %v", err)
	}
	return actual, nil
}

// buildTestResults builds test results from expected, inputs, and actual results
func (s *judgeService) buildTestResults(expected []interface{}, inputs [][]interface{}, actual []interface{}, response *types.Judge0Response) []types.TestCaseResult {
	var results []types.TestCaseResult
	for i := range expected {
		testResult := s.createTestCaseResult(i, expected[i], inputs[i], actual[i], response)
		results = append(results, testResult)
	}
	return results
}

// createTestCaseResult creates a single test case result
func (s *judgeService) createTestCaseResult(index int, expected interface{}, input []interface{}, actual interface{}, response *types.Judge0Response) types.TestCaseResult {
	expBytes, _ := json.Marshal(expected)
	actBytes, _ := json.Marshal(actual)

	return types.TestCaseResult{
		TestCaseIndex: index,
		Input:         string(mustJSON(input)),
		Expected:      string(expBytes),
		Actual:        strings.TrimSpace(string(actBytes)),
		Passed:        strings.TrimSpace(string(actBytes)) == strings.TrimSpace(string(expBytes)),
		ExecutionTime: getFloat64Time(response.Time),
		MemoryUsage:   response.Memory,
	}
}

// createEvaluationResult creates the final evaluation result
func (s *judgeService) createEvaluationResult(testResults []types.TestCaseResult, response *types.Judge0Response) *types.EvaluationResult {
	allPassed := s.checkAllTestsPassed(testResults)
	return &types.EvaluationResult{
		Passed:        allPassed,
		TestResults:   testResults,
		ExecutionTime: getFloat64Time(response.Time),
		MemoryUsage:   response.Memory,
	}
}

// checkAllTestsPassed checks if all test cases passed
func (s *judgeService) checkAllTestsPassed(testResults []types.TestCaseResult) bool {
	for _, result := range testResults {
		if !result.Passed {
			return false
		}
	}
	return true
}

func (s *judgeService) aggregatePerTest(code string, languageID int, problem *model.LeetCode) (*types.EvaluationResult, error) {
	var testCaseResults []types.TestCaseResult
	var totalExecutionTime float64
	var totalMemoryUsage float64
	allTestsPassed := true

	for testCaseIndex, testCase := range problem.TestCases {
		testCaseResult := s.evaluateTestCase(code, languageID, testCase, problem, testCaseIndex)
		testCaseResults = append(testCaseResults, *testCaseResult)
		if !testCaseResult.Passed {
			allTestsPassed = false
		}
		totalExecutionTime += testCaseResult.ExecutionTime
		totalMemoryUsage += testCaseResult.MemoryUsage
	}

	testCaseCount := float64(len(problem.TestCases))
	averageExecutionTime := totalExecutionTime / testCaseCount
	averageMemoryUsage := totalMemoryUsage / testCaseCount

	return &types.EvaluationResult{
		Passed:        allTestsPassed,
		TestResults:   testCaseResults,
		ExecutionTime: averageExecutionTime,
		MemoryUsage:   averageMemoryUsage,
	}, nil
}

func (s *judgeService) WrapCodeWithTestCase(code string, languageID int, testCase string, problem *model.LeetCode) (string, error) {
	return s.codeWrapper.WrapCode(code, languageID, testCase, problem)
}

// getLanguageID converts string language name to Judge0 API language ID
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

// evaluateTestCase evaluates code for a single test case
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
