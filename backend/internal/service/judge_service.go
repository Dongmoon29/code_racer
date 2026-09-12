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
	if err := model.ValidateFunctionContract(problem.FunctionName, problem.IOSchema.ParamTypes, problem.IOSchema.ReturnType); err != nil {
		return fmt.Errorf("problem function contract is invalid: %w", err)
	}
	if len(problem.TestCases) == 0 {
		return fmt.Errorf("problem has no test cases")
	}
	return nil
}

// NewJudgeService creates a new JudgeService instance with the provided configuration
func NewJudgeService(apiKey string, apiEndpoint string, logger logger.Logger, eventBus events.EventBus) interfaces.JudgeService {
	return &judgeService{
		codeWrapper:       factory.NewCodeWrapper(logger),
		judge0Client:      factory.NewJudge0Client(apiKey, apiEndpoint, logger),
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

	batchEvaluationResult, batchEvaluationError := s.aggregateBatch(code, languageID, problem)
	if batchEvaluationError == nil && batchEvaluationResult != nil {
		s.logEvaluationResult(batchEvaluationResult, languageID, problem, "batch")
	}

	return batchEvaluationResult, batchEvaluationError
}

// logEvaluationResult logs the evaluation result with detailed metrics
func (s *judgeService) logEvaluationResult(evaluationResult *types.EvaluationResult, languageID int, problem *model.Problem, evaluationMode string) {
	passedTestCount := s.countPassedTests(evaluationResult.TestResults)
	compileTimeoutSeconds, runTimeoutSeconds, memoryLimitKB := s.deriveLimits(problem)

	s.logger.Debug().
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
	if err := s.functionExtractor.ValidateExpectedFunction(code, language, expected); err != nil {
		return fmt.Errorf("invalid submission entry function: %w", err)
	}
	s.logger.Debug().Str("problemFunctionName", expected).Msg("Submission entry function validated")
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

func (s *judgeService) aggregateBatch(code string, languageID int, problem *model.Problem) (*types.EvaluationResult, error) {
	if len(problem.TestCases) == 0 {
		return nil, fmt.Errorf("problem has no test cases")
	}

	testInputs := make([]json.RawMessage, len(problem.TestCases))
	for i, testCase := range problem.TestCases {
		if !json.Valid([]byte(testCase.Input)) {
			return nil, fmt.Errorf("test case %d has invalid JSON input", i+1)
		}
		testInputs[i] = json.RawMessage(testCase.Input)
	}
	stdin, err := json.Marshal(testInputs)
	if err != nil {
		return nil, fmt.Errorf("failed to encode batch input: %w", err)
	}
	wrapper, err := s.codeWrapper.WrapCodeBatch(code, languageID, string(stdin), problem)
	if err != nil {
		return nil, fmt.Errorf("failed to wrap batch submission: %w", err)
	}

	compileTimeout, runTimeout, memoryLimit := s.deriveLimits(problem)
	// The problem limit applies to each test case. A batch performs all cases in
	// one process, so preserve that budget while avoiding repeated compilation.
	batchRunTimeout := runTimeout * len(problem.TestCases)
	apiTimeout := time.Duration(compileTimeout+batchRunTimeout+15) * time.Second
	ctx, cancel := context.WithTimeout(context.Background(), apiTimeout)
	defer cancel()

	response, err := s.judge0Client.SubmitCode(ctx, types.Judge0Request{
		SourceCode:       wrapper,
		LanguageID:       languageID,
		Stdin:            string(stdin),
		CompileTimeout:   compileTimeout,
		RunTimeout:       batchRunTimeout,
		MemoryLimit:      memoryLimit,
		EnableNetworking: false,
	})
	if err != nil {
		if strings.Contains(err.Error(), "exceeded the DAILY quota") {
			s.sendJudge0QuotaError()
		}
		if strings.Contains(err.Error(), "context deadline exceeded") || strings.Contains(err.Error(), "timeout") {
			s.sendJudge0TimeoutError()
		}
		return nil, fmt.Errorf("Judge0 API error: %w", err)
	}

	if errorType, message := batchResponseError(response); errorType != types.ErrorTypeNone {
		return &types.EvaluationResult{Passed: false, ErrorType: errorType, ErrorMessage: message}, nil
	}

	var actualOutputs []json.RawMessage
	if err := json.Unmarshal([]byte(strings.TrimSpace(response.Stdout)), &actualOutputs); err != nil {
		return &types.EvaluationResult{
			Passed:       false,
			ErrorType:    types.ErrorTypeRuntime,
			ErrorMessage: "judge returned an invalid batch result",
		}, nil
	}
	if len(actualOutputs) != len(problem.TestCases) {
		return &types.EvaluationResult{
			Passed:       false,
			ErrorType:    types.ErrorTypeRuntime,
			ErrorMessage: fmt.Sprintf("judge returned %d results for %d test cases", len(actualOutputs), len(problem.TestCases)),
		}, nil
	}

	results := make([]types.TestCaseResult, len(problem.TestCases))
	allPassed := true
	perTestTime := getFloat64Time(response.Time) / float64(len(problem.TestCases))
	for i, testCase := range problem.TestCases {
		actual := string(actualOutputs[i])
		passed := s.compareResults(actual, testCase.ExpectedOutput)
		if !passed {
			allPassed = false
		}
		results[i] = types.TestCaseResult{
			TestCaseIndex: i,
			Passed:        passed,
			Input:         testCase.Input,
			Expected:      testCase.ExpectedOutput,
			Actual:        actual,
			ExecutionTime: perTestTime,
			MemoryUsage:   response.Memory,
		}
	}

	return &types.EvaluationResult{
		Passed:        allPassed,
		TestResults:   results,
		ExecutionTime: perTestTime,
		MemoryUsage:   response.Memory,
	}, nil
}

func batchResponseError(response *types.Judge0Response) (types.ErrorType, string) {
	if response == nil {
		return types.ErrorTypeRuntime, "judge returned no response"
	}
	switch {
	case response.Status.ID == 5:
		return types.ErrorTypeTimeout, response.Status.Description
	case response.Status.ID == 6 || response.CompileError != "":
		return types.ErrorTypeCompilation, firstNonEmpty(response.CompileOutput, response.CompileError, response.Status.Description)
	case response.Status.ID >= 7 || response.Stderr != "":
		return types.ErrorTypeRuntime, firstNonEmpty(response.Stderr, response.Message, response.Status.Description)
	default:
		return types.ErrorTypeNone, ""
	}
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
	case "go":
		return constants.LanguageIDGo, nil
	default:
		return 0, fmt.Errorf("unsupported programming language: %s", language)
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return "code execution failed"
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
	case json.Number:
		if f, err := v.Float64(); err == nil {
			return f
		}
		return 0
	case string:
		if f, err := strconv.ParseFloat(strings.TrimSpace(v), 64); err == nil {
			return f
		}
		return 0
	default:
		return 0
	}
}

// EvaluateCodeWithRealtime evaluates every test case in one Judge0 submission
// while preserving the existing per-case WebSocket result messages.
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

	for testCaseIndex, testCase := range problem.TestCases {
		s.notifyTestCaseRunning(matchID, userID, testCase, testCaseIndex, len(problem.TestCases))
	}

	result, evaluationError := s.aggregateBatch(code, languageID, problem)
	if evaluationError != nil {
		s.notifySubmissionFailed(matchID, userID, evaluationError.Error())
		return nil, evaluationError
	}
	if result.ErrorType != types.ErrorTypeNone {
		s.notifySubmissionFailed(matchID, userID, result.ErrorMessage)
	} else if !result.Passed {
		s.notifySubmissionFailed(matchID, userID, "test cases failed")
	}
	for testCaseIndex := range result.TestResults {
		s.notifyTestCaseCompleted(matchID, userID, problem.TestCases[testCaseIndex], testCaseIndex, &result.TestResults[testCaseIndex])
	}
	s.logEvaluationResult(result, languageID, problem, "batch")
	s.notifySubmissionCompleted(matchID, userID, result)
	return result, nil
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
		s.logger.Info().
			Str("matchID", matchID.String()).
			Str("userID", userID.String()).
			Str("errorMessage", errorMessage).
			Msg("📤 Publishing SUBMISSION_FAILED event")
		s.eventBus.Publish(events.TopicSubmissionFailed, &events.SubmissionFailedEvent{
			MatchID: matchID.String(),
			UserID:  userID.String(),
			Message: fmt.Sprintf("Submission failed: %s", errorMessage),
		})
	} else {
		s.logger.Warn().Msg("EventBus is nil, cannot publish SUBMISSION_FAILED")
	}
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
