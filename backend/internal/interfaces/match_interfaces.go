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
	GetRandomLeetCodeByDifficulty(difficulty string) (*model.LeetCode, error)
	SubmitSolution(matchID, userID uuid.UUID, req *model.SubmitSolutionRequest) (*model.SubmitSolutionResponse, error)
}
