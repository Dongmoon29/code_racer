package interfaces

import (
	"context"

	"github.com/Dongmoon29/code_racer/internal/game"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
)

// GameEngine is the single application-facing contract for game operations.
// Transports such as HTTP and WebSocket depend on this facade instead of
// concrete persistence, Redis, or judge implementations.
type GameEngine interface {
	Start(ctx context.Context)
	Stop()
	Create(ctx context.Context, cmd game.CreateMatchCommand) (*model.Match, error)
	CreateSingle(ctx context.Context, cmd game.CreateSingleMatchCommand) (*model.Match, error)
	Get(ctx context.Context, matchID uuid.UUID) (*model.Match, error)
	GetActive(ctx context.Context, userID uuid.UUID) (*model.Match, error)
	Connect(ctx context.Context, cmd game.ParticipantCommand) error
	Disconnect(ctx context.Context, cmd game.ParticipantCommand) error
	Close(ctx context.Context, cmd game.ParticipantCommand) error
	Submit(ctx context.Context, cmd game.SubmitCommand) (*game.SubmissionResult, error)
	UpdateCode(ctx context.Context, cmd game.CodeSnapshotCommand) error
	GetPlayerCode(ctx context.Context, cmd game.ParticipantCommand) (string, error)
}
