package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/events"
	"github.com/Dongmoon29/code_racer/internal/factory"
	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/judge"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/types"
	"github.com/google/uuid"
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
	eventBus          events.EventBus
}

// Interface implementation check
var _ interfaces.JudgeService = (*judgeService)(nil)

// NewJudgeService creates a new JudgeService instance with the provided configuration
func NewJudgeService(apiKey string, apiEndpoint string, logger logger.Logger, eventBus events.EventBus) interfaces.JudgeService {
	return &judgeService{
		codeWrapper:       factory.NewCodeWrapper(logger),
		judge0Client:      factory.NewJudge0Client(apiKey, apiEndpoint),
		logger:            logger,
		functionExtractor: judge.NewFunctionExtractor(logger),
		eventBus:          eventBus,
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
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	judgeResponse, err := s.submitToJudge(ctx, wrappedCode, languageID, string(expectedOutputsJSON), problem)
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

func (s *judgeService) submitToJudge(ctx context.Context, wrappedCode string, languageID int, expectedOutputsJSON string, problem *model.LeetCode) (*types.Judge0Response, error) {
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
	judgeResponse, err := s.judge0Client.SubmitCode(ctx, judgeRequest)
	if err != nil {
		// Log quota exceeded identification
		errorMessage := fmt.Errorf("Judge0 API error: %w", err)
		if strings.Contains(errorMessage.Error(), "exceeded the DAILY quota") {
			s.logger.Error().
				Str("error_type", "judge0_quota_exceeded").
				Int("languageID", languageID).
				Msg("Judge0 quota exceeded")
			s.sendJudge0QuotaError()
		} else if strings.Contains(errorMessage.Error(), "context deadline exceeded") || strings.Contains(errorMessage.Error(), "timeout") {
			s.sendJudge0TimeoutError()
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

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	response, early := s.submitSingle(ctx, wrapped, languageID, expectedStr, index, problem)
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

func (s *judgeService) submitSingle(ctx context.Context, wrappedCode string, languageID int, expectedJSON string, index int, problem *model.LeetCode) (*types.Judge0Response, *types.TestCaseResult) {
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
	response, err := s.judge0Client.SubmitCode(ctx, request)
	if err != nil {
		s.logger.Error().Err(err).Msg("Judge0 API request failed")

		// Check if it's a timeout error and send WebSocket notification
		if strings.Contains(err.Error(), "context deadline exceeded") || strings.Contains(err.Error(), "timeout") {
			s.sendJudge0TimeoutError()
		}

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
	result.Passed = s.compareResults(result.Actual, result.Expected)
	s.logger.Debug().Int("testCaseIndex", index).Bool("passed", result.Passed).Str("actual", result.Actual).Str("expected", result.Expected).Float64("executionTime", result.ExecutionTime).Float64("memoryUsage", result.MemoryUsage).Msg("Test case evaluation completed")
	return result
}

// compareResults compares actual and expected results considering JSON types
func (s *judgeService) compareResults(actual, expected string) bool {
	// Parse both as JSON to handle type differences
	var actualValue, expectedValue interface{}

	if err := json.Unmarshal([]byte(actual), &actualValue); err != nil {
		// If actual is not valid JSON, fall back to string comparison
		return strings.TrimSpace(actual) == strings.TrimSpace(expected)
	}

	if err := json.Unmarshal([]byte(expected), &expectedValue); err != nil {
		// If expected is not valid JSON, fall back to string comparison
		return strings.TrimSpace(actual) == strings.TrimSpace(expected)
	}

	// Compare the parsed JSON values
	return s.deepEqual(actualValue, expectedValue)
}

// deepEqual performs deep comparison of JSON values
func (s *judgeService) deepEqual(a, b interface{}) bool {
	// Handle numeric types - convert to float64 for comparison
	if aNum, aOk := s.toFloat64(a); aOk {
		if bNum, bOk := s.toFloat64(b); bOk {
			return aNum == bNum
		}
	}

	// Handle string types
	if aStr, aOk := a.(string); aOk {
		if bStr, bOk := b.(string); bOk {
			return aStr == bStr
		}
	}

	// Handle boolean types
	if aBool, aOk := a.(bool); aOk {
		if bBool, bOk := b.(bool); bOk {
			return aBool == bBool
		}
	}

	// Handle arrays
	if aArr, aOk := a.([]interface{}); aOk {
		if bArr, bOk := b.([]interface{}); bOk {
			if len(aArr) != len(bArr) {
				return false
			}
			for i := range aArr {
				if !s.deepEqual(aArr[i], bArr[i]) {
					return false
				}
			}
			return true
		}
	}

	// Handle objects/maps
	if aMap, aOk := a.(map[string]interface{}); aOk {
		if bMap, bOk := b.(map[string]interface{}); bOk {
			if len(aMap) != len(bMap) {
				return false
			}
			for k, v := range aMap {
				if !s.deepEqual(v, bMap[k]) {
					return false
				}
			}
			return true
		}
	}

	// Fallback to direct comparison
	return a == b
}

// toFloat64 converts various numeric types to float64
func (s *judgeService) toFloat64(v interface{}) (float64, bool) {
	switch val := v.(type) {
	case float64:
		return val, true
	case float32:
		return float64(val), true
	case int:
		return float64(val), true
	case int32:
		return float64(val), true
	case int64:
		return float64(val), true
	case string:
		// Try to parse string as number
		if f, err := strconv.ParseFloat(val, 64); err == nil {
			return f, true
		}
	}
	return 0, false
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

// EvaluateCodeWithRealtime Code evaluation with real-time notifications (hybrid: batch first, fallback to per-test)
func (s *judgeService) EvaluateCodeWithRealtime(code string, language string, problem *model.LeetCode, matchID uuid.UUID, userID uuid.UUID) (*types.EvaluationResult, error) {
	// 1. Submission start notification (including total test cases)
	s.notifySubmissionStarted(matchID, userID, len(problem.TestCases))

	if err := s.ensureFunctionNameMatches(code, language, problem.FunctionName); err != nil {
		s.notifySubmissionFailed(matchID, userID, err.Error())
		return nil, err
	}

	languageID, err := s.getLanguageID(language)
	if err != nil {
		s.notifySubmissionFailed(matchID, userID, fmt.Sprintf("failed to get language ID: %v", err))
		return nil, fmt.Errorf("failed to get language ID: %w", err)
	}

	// 2. Try batch evaluation first with real-time notifications
	batchResult, batchSuccess, batchError := s.tryBatchEvaluateWithRealtime(code, languageID, problem, matchID, userID)
	if batchError != nil {
		s.notifySubmissionFailed(matchID, userID, fmt.Sprintf("batch evaluation failed: %v", batchError))
		return nil, batchError
	}

	if batchSuccess {
		s.logEvaluationResult(batchResult, languageID, problem, "batch_realtime")
		return batchResult, nil
	}

	// 3. Fallback to per-test evaluation with real-time notifications
	s.logger.Info().Msg("Batch evaluation not supported, falling back to per-test evaluation")
	perTestEvaluationResult, perTestEvaluationError := s.aggregatePerTestWithRealtime(code, languageID, problem, matchID, userID)
	if perTestEvaluationError == nil && perTestEvaluationResult != nil {
		s.logEvaluationResult(perTestEvaluationResult, languageID, problem, "per_test")
	}

	return perTestEvaluationResult, perTestEvaluationError
}

// notifySubmissionStarted Submission start notification
func (s *judgeService) notifySubmissionStarted(matchID uuid.UUID, userID uuid.UUID, totalTestCases int) {
	if s.eventBus != nil {
		s.eventBus.Publish(events.TopicSubmissionStarted, &events.SubmissionStartedEvent{
			MatchID:        matchID.String(),
			UserID:         userID.String(),
			TotalTestCases: totalTestCases,
		})
	}
}

// notifyTestCaseRunning Test case running notification
func (s *judgeService) notifyTestCaseRunning(matchID uuid.UUID, userID uuid.UUID, testCase model.TestCase, testCaseIndex int, totalTestCases int) {
	if s.eventBus != nil {
		s.eventBus.Publish(events.TopicTestCaseRunning, &events.TestCaseRunningEvent{
			MatchID:       matchID.String(),
			UserID:        userID.String(),
			TestCaseIndex: testCaseIndex,
			TestCase:      testCase,
			Total:         totalTestCases,
		})
	}
}

// notifyTestCaseCompleted Test case completion notification
func (s *judgeService) notifyTestCaseCompleted(matchID uuid.UUID, userID uuid.UUID, testCase model.TestCase, testCaseIndex int, result *types.TestCaseResult) {
	var actualOutput interface{}
	if result.Actual != "" {
		json.Unmarshal([]byte(result.Actual), &actualOutput)
	}
	if s.eventBus != nil {
		s.eventBus.Publish(events.TopicTestCaseCompleted, &events.TestCaseCompletedEvent{
			MatchID:       matchID.String(),
			UserID:        userID.String(),
			TestCaseIndex: testCaseIndex,
			Input:         testCase.Input,
			Expected:      testCase.Output,
			Actual:        actualOutput,
			Passed:        result.Passed,
			ExecutionTime: result.ExecutionTime,
			MemoryUsage:   result.MemoryUsage,
		})
	}
}

// notifySubmissionCompleted Submission completion notification
func (s *judgeService) notifySubmissionCompleted(matchID uuid.UUID, userID uuid.UUID, result *types.EvaluationResult) {
	if s.eventBus != nil {
		s.eventBus.Publish(events.TopicSubmissionCompleted, &events.SubmissionCompletedEvent{
			MatchID:       matchID.String(),
			UserID:        userID.String(),
			Passed:        result.Passed,
			PassedCount:   s.countPassedTests(result.TestResults),
			TotalCount:    len(result.TestResults),
			ExecutionTime: result.ExecutionTime,
			MemoryUsage:   result.MemoryUsage,
		})
	}
}

// notifySubmissionFailed Submission failure notification
func (s *judgeService) notifySubmissionFailed(matchID uuid.UUID, userID uuid.UUID, errorMessage string) {
	if s.eventBus != nil {
		s.eventBus.Publish(events.TopicSubmissionFailed, &events.SubmissionFailedEvent{
			MatchID: matchID.String(),
			UserID:  userID.String(),
			Message: fmt.Sprintf("Submission failed: %s", errorMessage),
		})
	}
}

// aggregatePerTestWithRealtime Individual evaluation with real-time notifications
func (s *judgeService) aggregatePerTestWithRealtime(code string, languageID int, problem *model.LeetCode, matchID uuid.UUID, userID uuid.UUID) (*types.EvaluationResult, error) {
	var testCaseResults []types.TestCaseResult
	var totalExecutionTime float64
	var totalMemoryUsage float64
	allTestsPassed := true
	totalTestCases := len(problem.TestCases)

	for testCaseIndex, testCase := range problem.TestCases {
		// Test case execution start notification
		s.notifyTestCaseRunning(matchID, userID, testCase, testCaseIndex, totalTestCases)

		// Test case execution
		testCaseResult := s.evaluateTestCase(code, languageID, testCase, problem, testCaseIndex)
		testCaseResults = append(testCaseResults, *testCaseResult)

		// Test case completion notification
		s.notifyTestCaseCompleted(matchID, userID, testCase, testCaseIndex, testCaseResult)

		// Aggregate metrics so far
		totalExecutionTime += testCaseResult.ExecutionTime
		totalMemoryUsage += testCaseResult.MemoryUsage

		// Short-circuit on first failure to save Judge0 cost
		if !testCaseResult.Passed {
			allTestsPassed = false
			s.logger.Debug().Str("Test case failed", fmt.Sprintf("Test case %d failed", testCaseIndex)).Msg("Test case failed")
			s.notifySubmissionFailed(matchID, userID, fmt.Sprintf("Test case %d failed", testCaseIndex))
			processed := float64(len(testCaseResults))
			if processed == 0 {
				processed = 1
			}
			return &types.EvaluationResult{
				Passed:        false,
				TestResults:   testCaseResults,
				ExecutionTime: totalExecutionTime / processed,
				MemoryUsage:   totalMemoryUsage / processed,
			}, nil
		}

		// Small delay (to allow UI to see the process)
		time.Sleep(100 * time.Millisecond)
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

// sendJudge0TimeoutError sends a timeout error message via WebSocket
func (s *judgeService) sendJudge0TimeoutError() {
	if s.eventBus != nil {
		s.eventBus.Publish(events.TopicJudge0Timeout, &events.Judge0TimeoutEvent{})
	}
}

// sendJudge0QuotaError sends a quota exceeded error message via WebSocket
func (s *judgeService) sendJudge0QuotaError() {
	if s.eventBus != nil {
		s.eventBus.Publish(events.TopicJudge0Quota, &events.Judge0QuotaEvent{})
	}
}

// tryBatchEvaluateWithRealtime attempts batch evaluation with real-time notifications
func (s *judgeService) tryBatchEvaluateWithRealtime(code string, languageID int, problem *model.LeetCode, matchID uuid.UUID, userID uuid.UUID) (*types.EvaluationResult, bool, error) {
	// Build inputs for batch evaluation
	testCaseInputs := make([][]interface{}, 0, len(problem.TestCases))
	expectedOutputs := make([]interface{}, 0, len(problem.TestCases))
	for _, testCase := range problem.TestCases {
		testCaseInputs = append(testCaseInputs, testCase.Input)
		expectedOutputs = append(expectedOutputs, testCase.Output)
	}
	inputsJSON, _ := json.Marshal(testCaseInputs)

	// Wrap batch (may fail for unsupported languages)
	wrappedCode, err := s.codeWrapper.WrapCodeBatch(code, languageID, string(inputsJSON), problem)
	if err != nil {
		return nil, false, nil
	}

	// Submit to Judge0
	expectedOutputsJSON, _ := json.Marshal(expectedOutputs)
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	judgeResponse, err := s.submitToJudge(ctx, wrappedCode, languageID, string(expectedOutputsJSON), problem)
	if err != nil {
		return nil, false, err
	}

	// Evaluate response
	evaluationResult, err := s.evaluateBatchResponse(judgeResponse, expectedOutputs, testCaseInputs)
	if err != nil {
		return nil, false, nil // fall back on parse errors
	}

	// Send real-time notifications for batch results
	s.notifyBatchResultsAsIndividual(matchID, userID, evaluationResult, problem)

	return evaluationResult, true, nil
}

// notifyBatchResultsAsIndividual converts batch results to individual test case notifications
func (s *judgeService) notifyBatchResultsAsIndividual(matchID uuid.UUID, userID uuid.UUID, result *types.EvaluationResult, problem *model.LeetCode) {
	totalTestCases := len(result.TestResults)

	// Simulate individual test case execution with small delays for UI feedback
	for i, testResult := range result.TestResults {
		// Get corresponding test case from problem
		var testCase model.TestCase
		if i < len(problem.TestCases) {
			testCase = problem.TestCases[i]
		}

		// Send test case running notification
		s.notifyTestCaseRunning(matchID, userID, testCase, i, totalTestCases)

		// Small delay to allow UI to show running state
		time.Sleep(50 * time.Millisecond)

		// Send test case completed notification
		s.notifyTestCaseCompleted(matchID, userID, testCase, i, &testResult)

		// Small delay between test cases for better UX
		time.Sleep(50 * time.Millisecond)
	}

	// Send final submission completed notification
	s.notifySubmissionCompleted(matchID, userID, result)
}
