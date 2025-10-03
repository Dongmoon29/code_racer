package interfaces

import (
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
)

// GameCreator는 게임 생성 기능만 담당하는 인터페이스
type ASasdasd interface {
	CreateGameForMatch(player1ID, player2ID uuid.UUID, difficulty string) (*model.Match, error)
	GetRandomLeetCodeByDifficulty(difficulty string) (*model.LeetCode, error)
}
