package interfaces

import (
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
)

// GameCreator는 게임 생성 기능만 담당하는 인터페이스
type GameCreator interface {
	CreateGameForMatch(player1ID, player2ID uuid.UUID, difficulty string) (*model.Game, error)
	GetRandomLeetCodeByDifficulty(difficulty string) (*model.LeetCode, error)
}

// GameNotifier는 게임 알림 기능만 담당하는 인터페이스
type GameNotifier interface {
	BroadcastGameStart(gameID uuid.UUID, message []byte)
	BroadcastGameEnd(gameID uuid.UUID, message []byte)
}
