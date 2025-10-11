package model

// WebSocketMessageType WebSocket message type constants
const (
	MessageTypeCodeUpdate = "code_update"
	MessageTypeGameStart  = "game_start"
	MessageTypeGameEnd    = "game_end"
)

// SubmissionStatusMessage submission status message
type SubmissionStatusMessage struct {
	Type            string   `json:"type"`
	MatchID         string   `json:"match_id"`
	UserID          string   `json:"user_id"`
	Status          string   `json:"status"` // "started", "completed", "failed"
	Passed          *bool    `json:"passed,omitempty"`
	TotalTestCases  *int     `json:"total_test_cases,omitempty"`
	PassedTestCases *int     `json:"passed_test_cases,omitempty"`
	ExecutionTime   *float64 `json:"execution_time,omitempty"`
	MemoryUsage     *float64 `json:"memory_usage,omitempty"`
	Message         string   `json:"message"`
	Timestamp       int64    `json:"timestamp"`
}

// TestCaseDetailMessage test case detail information message
type TestCaseDetailMessage struct {
	Type           string      `json:"type"`
	MatchID        string      `json:"match_id"`
	UserID         string      `json:"user_id"`
	TestCaseIndex  int         `json:"test_case_index"`
	TotalTestCases int         `json:"total_test_cases"`
	Status         string      `json:"status"`                  // "running", "completed"
	Input          interface{} `json:"input"`                   // Actual input value
	ExpectedOutput interface{} `json:"expected_output"`         // Expected output value
	ActualOutput   interface{} `json:"actual_output,omitempty"` // Actual output value
	Passed         *bool       `json:"passed,omitempty"`
	ExecutionTime  *float64    `json:"execution_time,omitempty"`
	MemoryUsage    *float64    `json:"memory_usage,omitempty"`
	Timestamp      int64       `json:"timestamp"`
}

// CodeUpdateMessage code update message
type CodeUpdateMessage struct {
	Type    string `json:"type"`
	MatchID string `json:"match_id"`
	UserID  string `json:"user_id"`
	Code    string `json:"code"`
}

// MatchEndMessage 매치 종료 메시지
type MatchEndMessage struct {
	Type     string `json:"type"`
	MatchID  string `json:"match_id"`
	WinnerID string `json:"winner_id"`
}
