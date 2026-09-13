package interfaces

import (
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
)

// MatchService defines the interface for match-related operations
type MatchService interface {
	CreateMatch(player1ID, player2ID uuid.UUID, difficulty string, mode string) (*model.Match, error)
	CreateSinglePlayerMatch(playerID uuid.UUID, difficulty string) (*model.Match, error)
	GetMatch(matchID uuid.UUID) (*model.Match, error)
	GetActiveMatchForUser(userID uuid.UUID) (*model.Match, error)
	HandlePlayerConnected(matchID, userID uuid.UUID) error
	HandlePlayerDisconnected(matchID, userID uuid.UUID) error
	CloseMatch(matchID, userID uuid.UUID) error
	GetRandomProblemByDifficulty(difficulty string) (*model.Problem, error)
	SubmitSolution(matchID, userID uuid.UUID, req *model.SubmitSolutionRequest) (*model.SubmitSolutionResponse, error)
}
