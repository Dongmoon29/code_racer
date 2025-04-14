package types

// Judge0Request represents the request structure for Judge0 API
type Judge0Request struct {
	SourceCode       string `json:"source_code"`
	LanguageID       int    `json:"language_id"`
	ExpectedOutput   string `json:"expected_output"`
	CompileTimeout   int    `json:"compile_timeout"`
	RunTimeout       int    `json:"run_timeout"`
	MemoryLimit      int    `json:"memory_limit"`
	EnableNetworking bool   `json:"enable_networking"`
}

// Judge0Response represents the response structure from Judge0 API
type Judge0Response struct {
	Stdout       string      `json:"stdout"`
	Stderr       string      `json:"stderr"`
	CompileError string      `json:"compile_error"`
	Time         interface{} `json:"time"`
	Memory       float64     `json:"memory"`
}

// EvaluationResult represents the final result of code evaluation
type EvaluationResult struct {
	Passed        bool             `json:"passed"`
	ErrorMessage  string           `json:"error_message,omitempty"`
	TestResults   []TestCaseResult `json:"test_results,omitempty"`
	ExecutionTime float64          `json:"execution_time,omitempty"`
	MemoryUsage   float64          `json:"memory_usage,omitempty"`
}

// TestCaseResult represents the result of an individual test case execution
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
