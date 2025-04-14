package service

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"

	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/factory"
	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/types"
)

type judgeService struct {
	codeWrapper  interfaces.CodeWrapper
	judge0Client interfaces.Judge0Client
	logger       logger.Logger
}

// 인터페이스 구현 확인
var _ interfaces.JudgeService = (*judgeService)(nil)

func NewJudgeService(apiKey string, apiEndpoint string, logger logger.Logger) interfaces.JudgeService {
	return &judgeService{
		codeWrapper:  factory.NewCodeWrapper(logger),
		judge0Client: factory.NewJudge0Client(apiKey, apiEndpoint),
		logger:       logger,
	}
}

func (s *judgeService) EvaluateCode(code string, language string, problem *model.LeetCode) (*types.EvaluationResult, error) {
	languageID, err := s.getLanguageID(language)
	if err != nil {
		return nil, err
	}

	results := make(chan *types.TestCaseResult, len(problem.TestCases))
	var wg sync.WaitGroup

	for i, testCase := range problem.TestCases {
		wg.Add(1)
		go s.evaluateTestCase(code, languageID, testCase, problem, i, results, &wg)
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	return s.collectResults(results)
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
	code string,
	languageID int,
	testCase model.TestCase,
	problem *model.LeetCode,
	index int,
	results chan<- *types.TestCaseResult,
	wg *sync.WaitGroup,
) {
	defer wg.Done()

	testCaseJSON, err := json.Marshal(testCase.Input)
	if err != nil {
		results <- &types.TestCaseResult{
			TestCaseIndex: index,
			Passed:        false,
			ErrorMessage:  fmt.Sprintf("Failed to marshal test case: %v", err),
		}
		return
	}

	expectedJSON, err := json.Marshal(testCase.Output)
	if err != nil {
		results <- &types.TestCaseResult{
			TestCaseIndex: index,
			Passed:        false,
			ErrorMessage:  fmt.Sprintf("Failed to marshal expected output: %v", err),
		}
		return
	}

	wrappedCode, err := s.codeWrapper.WrapCode(code, languageID, string(testCaseJSON), problem)
	if err != nil {
		results <- &types.TestCaseResult{
			TestCaseIndex: index,
			Passed:        false,
			ErrorMessage:  fmt.Sprintf("Failed to wrap code: %v", err),
		}
		return
	}

	request := types.Judge0Request{
		SourceCode:       wrappedCode,
		LanguageID:       languageID,
		ExpectedOutput:   string(expectedJSON),
		CompileTimeout:   10,     // 10초
		RunTimeout:       5,      // 5초
		MemoryLimit:      128000, // 128MB
		EnableNetworking: false,
	}

	response, err := s.judge0Client.SubmitCode(request)
	if err != nil {
		results <- &types.TestCaseResult{
			TestCaseIndex: index,
			Passed:        false,
			ErrorMessage:  fmt.Sprintf("Judge0 API error: %v", err),
		}
		return
	}

	result := &types.TestCaseResult{
		TestCaseIndex: index,
		Input:         string(testCaseJSON),
		Expected:      string(expectedJSON),
		ExecutionTime: getFloat64Time(response.Time),
		MemoryUsage:   response.Memory,
	}

	if response.CompileError != "" {
		result.Passed = false
		result.ErrorMessage = fmt.Sprintf("Compilation error: %s", response.CompileError)
		results <- result
		return
	}

	if response.Stderr != "" {
		result.Passed = false
		result.ErrorMessage = fmt.Sprintf("Runtime error: %s", response.Stderr)
		results <- result
		return
	}

	result.Actual = strings.TrimSpace(response.Stdout)
	result.Passed = strings.TrimSpace(result.Actual) == strings.TrimSpace(result.Expected)

	results <- result
}

func (s *judgeService) collectResults(results <-chan *types.TestCaseResult) (*types.EvaluationResult, error) {
	var testResults []types.TestCaseResult
	var totalTime float64
	var maxMemory float64
	allPassed := true

	for result := range results {
		testResults = append(testResults, *result)
		totalTime += result.ExecutionTime
		if result.MemoryUsage > maxMemory {
			maxMemory = result.MemoryUsage
		}
		if !result.Passed {
			allPassed = false
		}
	}

	return &types.EvaluationResult{
		Passed:        allPassed,
		TestResults:   testResults,
		ExecutionTime: totalTime,
		MemoryUsage:   maxMemory,
	}, nil
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
