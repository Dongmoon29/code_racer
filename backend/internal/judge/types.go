package judge

// EvaluationResult 는 코드 평가의 최종 결과를 나타냅니다
type EvaluationResult struct {
	Passed        bool             `json:"passed"`
	ErrorMessage  string           `json:"error_message,omitempty"`
	TestResults   []TestCaseResult `json:"test_results,omitempty"`
	ExecutionTime float64          `json:"execution_time,omitempty"`
	MemoryUsage   float64          `json:"memory_usage,omitempty"`
}

// TestCaseResult 는 개별 테스트 케이스의 실행 결과를 나타냅니다
type TestCaseResult struct {
	TestCaseIndex int     `json:"test_case_index"`
	Passed        bool    `json:"passed"`
	Input         string  `json:"input"`
	Expected      string  `json:"expected"`
	Actual        string  `json:"actual,omitempty"`
	ErrorMessage  string  `json:"error_message,omitempty"`
	ExecutionTime float64 `json:"execution_time,omitempty"`
	MemoryUsage   float64 `json:"memory_usage,omitempty"`
}
