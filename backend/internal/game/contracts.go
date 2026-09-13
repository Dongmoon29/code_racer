// Package game defines transport-independent commands and results for the
// application game engine. HTTP and WebSocket adapters should depend on these
// contracts instead of persistence or request payload types.
package game

import (
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
)

type CreateMatchCommand struct {
	PlayerAID  uuid.UUID
	PlayerBID  uuid.UUID
	Difficulty model.Difficulty
	Mode       model.MatchMode
}

type CreateSingleMatchCommand struct {
	PlayerID   uuid.UUID
	Difficulty model.Difficulty
}

type ParticipantCommand struct {
	MatchID uuid.UUID
	UserID  uuid.UUID
}

type SubmitCommand struct {
	MatchID  uuid.UUID
	UserID   uuid.UUID
	Code     string
	Language string
}

type CodeSnapshotCommand struct {
	MatchID  uuid.UUID
	UserID   uuid.UUID
	Code     string
	Language string
}

type SubmissionResult struct {
	Success  bool
	Message  string
	IsWinner bool
}
