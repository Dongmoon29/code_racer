package model

// WebSocketMessageType WebSocket 메시지 타입 상수
const (
	MessageTypeCodeUpdate = "code_update"
	MessageTypeGameStart  = "game_start"
	MessageTypeGameEnd    = "game_end"
)

// SubmissionStatusMessage 제출 상태 메시지
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

// TestCaseDetailMessage 테스트 케이스 상세 정보 메시지
type TestCaseDetailMessage struct {
	Type           string      `json:"type"`
	MatchID        string      `json:"match_id"`
	UserID         string      `json:"user_id"`
	TestCaseIndex  int         `json:"test_case_index"`
	TotalTestCases int         `json:"total_test_cases"`
	Status         string      `json:"status"`                  // "running", "completed"
	Input          interface{} `json:"input"`                   // 실제 입력값
	ExpectedOutput interface{} `json:"expected_output"`         // 예상 출력값
	ActualOutput   interface{} `json:"actual_output,omitempty"` // 실제 출력값
	Passed         *bool       `json:"passed,omitempty"`
	ExecutionTime  *float64    `json:"execution_time,omitempty"`
	MemoryUsage    *float64    `json:"memory_usage,omitempty"`
	Timestamp      int64       `json:"timestamp"`
}

// CodeUpdateMessage 코드 업데이트 메시지
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
