package service

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"

	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/judge"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
)

type JudgeService interface {
	EvaluateCode(code string, language string, problem *model.LeetCode) (*judge.EvaluationResult, error)
}

type judgeService struct {
	codeWrapper  *judge.CodeWrapper
	judge0Client *judge.Judge0Client
	logger       logger.Logger
}

func NewJudgeService(apiKey string, apiEndpoint string, logger logger.Logger) JudgeService {
	return &judgeService{
		codeWrapper:  judge.NewCodeWrapper(logger),
		judge0Client: judge.NewJudge0Client(apiKey, apiEndpoint),
		logger:       logger,
	}
}

func (s *judgeService) EvaluateCode(code string, language string, problem *model.LeetCode) (*judge.EvaluationResult, error) {
	languageID, err := s.getLanguageID(language)
	if err != nil {
		return nil, err
	}

	results := make(chan *judge.TestCaseResult, len(problem.TestCases))
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
	results chan<- *judge.TestCaseResult,
	wg *sync.WaitGroup,
) {
	defer wg.Done()

	// 테스트 케이스를 JSON 문자열로 변환
	testCaseJSON, err := json.Marshal(testCase.Input)
	if err != nil {
		results <- &judge.TestCaseResult{
			TestCaseIndex: index,
			Passed:        false,
			ErrorMessage:  fmt.Sprintf("Failed to marshal test case: %v", err),
		}
		return
	}

	// 예상 출력을 JSON 문자열로 변환
	expectedJSON, err := json.Marshal(testCase.Output)
	if err != nil {
		results <- &judge.TestCaseResult{
			TestCaseIndex: index,
			Passed:        false,
			ErrorMessage:  fmt.Sprintf("Failed to marshal expected output: %v", err),
		}
		return
	}

	// 테스트 코드 래핑
	wrappedCode, err := s.codeWrapper.WrapCode(code, languageID, string(testCaseJSON), problem)
	if err != nil {
		results <- &judge.TestCaseResult{
			TestCaseIndex: index,
			Passed:        false,
			ErrorMessage:  fmt.Sprintf("Failed to wrap code: %v", err),
		}
		return
	}

	// Judge0 API 요청 준비
	request := judge.Judge0Request{
		SourceCode:       wrappedCode,
		LanguageID:       languageID,
		ExpectedOutput:   string(expectedJSON),
		CompileTimeout:   10,     // 10초
		RunTimeout:       5,      // 5초
		MemoryLimit:      128000, // 128MB
		EnableNetworking: false,
	}

	// Judge0 API 호출
	response, err := s.judge0Client.SubmitCode(request)
	if err != nil {
		results <- &judge.TestCaseResult{
			TestCaseIndex: index,
			Passed:        false,
			ErrorMessage:  fmt.Sprintf("Judge0 API error: %v", err),
		}
		return
	}

	// 결과 분석
	result := &judge.TestCaseResult{
		TestCaseIndex: index,
		Input:         string(testCaseJSON),
		Expected:      string(expectedJSON),
		ExecutionTime: getFloat64Time(response.Time),
		MemoryUsage:   response.Memory,
	}

	// 컴파일 에러 체크
	if response.CompileError != "" {
		result.Passed = false
		result.ErrorMessage = fmt.Sprintf("Compilation error: %s", response.CompileError)
		results <- result
		return
	}

	// 런타임 에러 체크
	if response.Stderr != "" {
		result.Passed = false
		result.ErrorMessage = fmt.Sprintf("Runtime error: %s", response.Stderr)
		results <- result
		return
	}

	// 실행 결과 비교
	result.Actual = strings.TrimSpace(response.Stdout)
	result.Passed = strings.TrimSpace(result.Actual) == strings.TrimSpace(result.Expected)

	results <- result
}

// collectResults는 모든 테스트 케이스의 결과를 수집하고 최종 평가 결과를 반환합니다
func (s *judgeService) collectResults(results <-chan *judge.TestCaseResult) (*judge.EvaluationResult, error) {
	var testResults []judge.TestCaseResult
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

	return &judge.EvaluationResult{
		Passed:        allPassed,
		TestResults:   testResults,
		ExecutionTime: totalTime,
		MemoryUsage:   maxMemory,
	}, nil
}

// getFloat64Time은 interface{} 타입의 시간값을 float64로 변환합니다
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

func (s *judgeService) wrapCodeWithTestCase(code string, languageID int, testCase string, problem *model.LeetCode) (string, error) {
	return s.codeWrapper.WrapCode(code, languageID, testCase, problem)
}
