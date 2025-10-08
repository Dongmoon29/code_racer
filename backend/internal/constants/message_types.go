package constants

// WebSocket message types for consistent communication between frontend and backend
const (
	// Authentication messages
	Auth = "auth"

	// Connection management
	Ping = "ping"
	Pong = "pong"

	// Game-related messages
	CodeUpdate   = "code_update"
	GameFinished = "game_finished"

	// Real-time scoring messages
	SubmissionStarted   = "submission_started"
	TestCaseRunning     = "test_case_running"
	TestCaseCompleted   = "test_case_completed"
	SubmissionCompleted = "submission_completed"
	SubmissionFailed    = "submission_failed"

	// Matchmaking messages
	StartMatching  = "start_matching"
	CancelMatching = "cancel_matching"
	MatchingStatus = "matching_status"
	MatchFound     = "match_found"

	// Error handling
	Error = "error"

	// Judge0 specific errors
	Judge0TimeoutError = "judge0_timeout_error"
	Judge0QuotaError   = "judge0_quota_error"
)

// MessageType represents all possible WebSocket message types
type MessageType string

// Message type constants
var (
	MessageTypeAuth                MessageType = Auth
	MessageTypePing                MessageType = Ping
	MessageTypePong                MessageType = Pong
	MessageTypeCodeUpdate          MessageType = CodeUpdate
	MessageTypeGameFinished        MessageType = GameFinished
	MessageTypeSubmissionStarted   MessageType = SubmissionStarted
	MessageTypeTestCaseRunning     MessageType = TestCaseRunning
	MessageTypeTestCaseCompleted   MessageType = TestCaseCompleted
	MessageTypeSubmissionCompleted MessageType = SubmissionCompleted
	MessageTypeSubmissionFailed    MessageType = SubmissionFailed
	MessageTypeStartMatching       MessageType = StartMatching
	MessageTypeCancelMatching      MessageType = CancelMatching
	MessageTypeMatchingStatus      MessageType = MatchingStatus
	MessageTypeMatchFound          MessageType = MatchFound
	MessageTypeError               MessageType = Error
	MessageTypeJudge0TimeoutError  MessageType = Judge0TimeoutError
	MessageTypeJudge0QuotaError    MessageType = Judge0QuotaError
)

// IsValidMessageType checks if the given string is a valid message type
func IsValidMessageType(msgType string) bool {
	switch msgType {
	case Auth, Ping, Pong, CodeUpdate, GameFinished,
		SubmissionStarted, TestCaseRunning, TestCaseCompleted, SubmissionCompleted, SubmissionFailed,
		StartMatching, CancelMatching, MatchingStatus, MatchFound, Error,
		Judge0TimeoutError, Judge0QuotaError:
		return true
	default:
		return false
	}
}

// GetAllMessageTypes returns all valid message types
func GetAllMessageTypes() []MessageType {
	return []MessageType{
		MessageTypeAuth,
		MessageTypePing,
		MessageTypePong,
		MessageTypeCodeUpdate,
		MessageTypeGameFinished,
		MessageTypeSubmissionStarted,
		MessageTypeTestCaseRunning,
		MessageTypeTestCaseCompleted,
		MessageTypeSubmissionCompleted,
		MessageTypeSubmissionFailed,
		MessageTypeStartMatching,
		MessageTypeCancelMatching,
		MessageTypeMatchingStatus,
		MessageTypeMatchFound,
		MessageTypeError,
		MessageTypeJudge0TimeoutError,
		MessageTypeJudge0QuotaError,
	}
}

// MessageTypeCategory represents the category of a message type
type MessageTypeCategory string

const (
	CategoryAuth        MessageTypeCategory = "auth"
	CategoryConnection  MessageTypeCategory = "connection"
	CategoryGame        MessageTypeCategory = "game"
	CategoryMatchmaking MessageTypeCategory = "matchmaking"
	CategoryError       MessageTypeCategory = "error"
)

// GetMessageTypeCategory returns the category of a message type
func GetMessageTypeCategory(msgType string) MessageTypeCategory {
	switch msgType {
	case Auth:
		return CategoryAuth
	case Ping, Pong:
		return CategoryConnection
	case CodeUpdate, GameFinished, SubmissionStarted, TestCaseRunning, TestCaseCompleted, SubmissionCompleted, SubmissionFailed:
		return CategoryGame
	case StartMatching, CancelMatching, MatchingStatus, MatchFound:
		return CategoryMatchmaking
	case Error, Judge0TimeoutError, Judge0QuotaError:
		return CategoryError
	default:
		return CategoryError
	}
}
