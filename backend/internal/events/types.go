package events

import (
	"github.com/Dongmoon29/code_racer/internal/model"
)

// MatchCreatedEvent is published after a match is successfully created
type MatchCreatedEvent struct {
	Match *model.Match
}

// GameFinishedEvent is published when a game ends and a winner is determined
type GameFinishedEvent struct {
	MatchID  string
	WinnerID string
}

// Realtime judge events
type SubmissionStartedEvent struct {
    MatchID        string
    UserID         string
    TotalTestCases int
}

type TestCaseRunningEvent struct {
    MatchID       string
    UserID        string
    TestCaseIndex int
    TestCase      interface{}
    Total         int
}

type TestCaseCompletedEvent struct {
    MatchID       string
    UserID        string
    TestCaseIndex int
    Input         interface{}
    Expected      interface{}
    Actual        interface{}
    Passed        bool
    ExecutionTime float64
    MemoryUsage   float64
}

type SubmissionCompletedEvent struct {
    MatchID       string
    UserID        string
    Passed        bool
    PassedCount   int
    TotalCount    int
    ExecutionTime float64
    MemoryUsage   float64
}

type SubmissionFailedEvent struct {
    MatchID string
    UserID  string
    Message string
}

type Judge0TimeoutEvent struct{}
type Judge0QuotaEvent struct{}
