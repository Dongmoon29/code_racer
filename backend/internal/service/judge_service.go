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

func (s *judgeService) validateProblemIOSchema(problem *model.Problem) error {
	if problem == nil {
		return fmt.Errorf("problem is nil")
	}
	raw := strings.TrimSpace(problem.IOSchema.ParamTypes)
	if raw == "" {
		return fmt.Errorf("problem io_schema.param_types is missing")
	}
	var pts []string
	if err := json.Unmarshal([]byte(raw), &pts); err != nil || len(pts) == 0 {
		return fmt.Errorf("problem io_schema.param_types is invalid")
	}
	for i, pt := range pts {
		if strings.TrimSpace(pt) == "" {
			return fmt.Errorf("problem io_schema.param_types[%d] is empty", i)
		}
	}
	if strings.TrimSpace(problem.IOSchema.ReturnType) == "" {
		return fmt.Errorf("problem io_schema.return_type is missing")
	}
	return nil
}

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

func (s *judgeService) EvaluateCode(code string, language string, problem *model.Problem) (*types.EvaluationResult, error) {
	if err := s.validateProblemIOSchema(problem); err != nil {
		return nil, err
	}
	if err := s.ensureFunctionNameMatches(code, language, problem.FunctionName); err != nil {
		return nil, err
	}

	languageID, err := s.getLanguageID(language)
	if err != nil {
		return nil, fmt.Errorf("failed to get language ID: %w", err)
	}

	// LeetCode-style: always per-test evaluation.
	perTestEvaluationResult, perTestEvaluationError := s.aggregatePerTest(code, languageID, problem)
	if perTestEvaluationError == nil && perTestEvaluationResult != nil {
		s.logEvaluationResult(perTestEvaluationResult, languageID, problem, "per_test")
	}

	return perTestEvaluationResult, perTestEvaluationError
}

// logEvaluationResult logs the evaluation result with detailed metrics
func (s *judgeService) logEvaluationResult(evaluationResult *types.EvaluationResult, languageID int, problem *model.Problem, evaluationMode string) {
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

// deriveLimits converts model constraints to Judge0 limits
func (s *judgeService) deriveLimits(problem *model.Problem) (compileTimeout int, runTimeout int, memoryLimit int) {
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

func (s *judgeService) aggregatePerTest(code string, languageID int, problem *model.Problem) (*types.EvaluationResult, error) {
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

func (s *judgeService) WrapCodeWithTestCase(code string, languageID int, testCase string, problem *model.Problem) (string, error) {
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
	problem *model.Problem,
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
	response, early := s.submitSingle(ctx, wrapped, languageID, testCase.Input, expectedStr, index, problem)
	if early != nil {
		return early
	}

	return s.evaluateSingleResponse(response, testCase, expectedStr, index)
}

func (s *judgeService) buildSingleWrappedCode(code string, languageID int, testCase model.TestCase, problem *model.Problem, index int) (string, string, *types.TestCaseResult) {
	wrappedCode, err := s.codeWrapper.WrapCode(code, languageID, testCase.Input, problem)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to wrap code")
		return "", "", &types.TestCaseResult{TestCaseIndex: index, Passed: false, ErrorMessage: fmt.Sprintf("Failed to wrap code: %v", err)}
	}
	s.logger.Debug().Int("testCaseIndex", index).Str("wrappedCode", wrappedCode).Msg("Code wrapped successfully")
	return wrappedCode, testCase.ExpectedOutput, nil
}

func (s *judgeService) submitSingle(ctx context.Context, wrappedCode string, languageID int, stdin string, expectedJSON string, index int, problem *model.Problem) (*types.Judge0Response, *types.TestCaseResult) {
	compileTimeout, runTimeout, memoryLimit := s.deriveLimits(problem)
	request := types.Judge0Request{
		SourceCode:       wrappedCode,
		LanguageID:       languageID,
		ExpectedOutput:   expectedJSON,
		Stdin:            stdin,
		CompileTimeout:   compileTimeout,
		RunTimeout:       runTimeout,
		MemoryLimit:      memoryLimit,
		EnableNetworking: false,
	}
	response, err := s.judge0Client.SubmitCode(ctx, request)
	if err != nil {
		s.logger.Error().Err(err).Msg("Judge0 API request failed")

		// Check if it's a timeout error and send WebSocket notification
		if strings.Contains(err.Error(), "exceeded the DAILY quota") {
			s.sendJudge0QuotaError()
		}
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
		result.ErrorMessage = response.CompileError // Return raw compile error
		return result
	}
	// NOTE: Judge0 may populate compile_output on compilation failures even when compile_error is empty.
	// However, compile_output can also include non-fatal messages depending on language/toolchain.
	// We only treat it as fatal when the run did not produce output and did not execute.
	if response.CompileOutput != "" {
		noStdout := strings.TrimSpace(response.Stdout) == ""
		noStderr := strings.TrimSpace(response.Stderr) == ""
		noExec := response.Time == nil || getFloat64Time(response.Time) == 0
		if noStdout && noStderr && noExec {
			s.logger.Error().Str("compileError", response.CompileOutput).Msg("Compilation error occurred")
			result.Passed = false
			result.ErrorMessage = response.CompileOutput
			return result
		}
		s.logger.Debug().Str("compileOutput", response.CompileOutput).Msg("Non-fatal compile output received")
	}
	if response.Stderr != "" {
		s.logger.Error().Str("stderr", response.Stderr).Msg("Runtime error occurred")
		result.Passed = false
		result.ErrorMessage = response.Stderr // Return raw stderr
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
func (s *judgeService) EvaluateCodeWithRealtime(code string, language string, problem *model.Problem, matchID uuid.UUID, userID uuid.UUID) (*types.EvaluationResult, error) {
	// 1. Submission start notification (including total test cases)
	s.notifySubmissionStarted(matchID, userID, len(problem.TestCases))

	if err := s.validateProblemIOSchema(problem); err != nil {
		s.notifySubmissionFailed(matchID, userID, err.Error())
		return nil, err
	}
	if err := s.ensureFunctionNameMatches(code, language, problem.FunctionName); err != nil {
		s.notifySubmissionFailed(matchID, userID, err.Error())
		return nil, err
	}

	languageID, err := s.getLanguageID(language)
	if err != nil {
		s.notifySubmissionFailed(matchID, userID, fmt.Sprintf("failed to get language ID: %v", err))
		return nil, fmt.Errorf("failed to get language ID: %w", err)
	}

	// LeetCode-style: always per-test evaluation with real-time notifications.
	perTestEvaluationResult, perTestEvaluationError := s.aggregatePerTestWithRealtime(code, languageID, problem, matchID, userID)
	if perTestEvaluationError == nil && perTestEvaluationResult != nil {
		s.logEvaluationResult(perTestEvaluationResult, languageID, problem, "per_test")
		s.notifySubmissionCompleted(matchID, userID, perTestEvaluationResult)
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
			Expected:      testCase.ExpectedOutput,
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
func (s *judgeService) aggregatePerTestWithRealtime(code string, languageID int, problem *model.Problem, matchID uuid.UUID, userID uuid.UUID) (*types.EvaluationResult, error) {
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

			// If compilation error occurred (check ErrorMessage for compile error indicators)
			// Judge0 returns compile errors in ErrorMessage when CompileError field is set
			if testCaseResult.ErrorMessage != "" {
				// Check if it's a compilation error by looking at the error message
				// Judge0 compile errors typically contain compilation-related keywords
				errorLower := strings.ToLower(testCaseResult.ErrorMessage)
				isCompilationError := strings.Contains(errorLower, "compilation") ||
					strings.Contains(errorLower, "syntax error") ||
					strings.Contains(errorLower, "compile") ||
					strings.Contains(errorLower, "cannot find") ||
					strings.Contains(errorLower, "undefined") ||
					strings.Contains(errorLower, "expected") ||
					strings.Contains(errorLower, "unexpected")

				if isCompilationError {
					s.logger.Debug().Msg("Compilation error detected, stopping evaluation")
					s.notifySubmissionFailed(matchID, userID, testCaseResult.ErrorMessage)
					processed := float64(len(testCaseResults))
					if processed == 0 {
						processed = 1
					}
					return &types.EvaluationResult{
						Passed:        false,
						ErrorType:     types.ErrorTypeCompilation,
						ErrorMessage:  testCaseResult.ErrorMessage,
						TestResults:   testCaseResults,
						ExecutionTime: totalExecutionTime / processed,
						MemoryUsage:   totalMemoryUsage / processed,
					}, nil
				}
			}

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
