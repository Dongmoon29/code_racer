package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// GameStatus 게임 상태를 표현하는 enum
type GameStatus string

const (
	GameStatusWaiting  GameStatus = "waiting"  // 상대방을 기다리는 중
	GameStatusPlaying  GameStatus = "playing"  // 게임 진행 중
	GameStatusFinished GameStatus = "finished" // 게임 종료
	GameStatusClosed   GameStatus = "closed"   // 방장이 닫은 상태
)

// Game 게임 방 정보를 담는 모델
type Game struct {
	ID         uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	CreatorID  uuid.UUID  `gorm:"type:uuid;not null" json:"creator_id"`
	Creator    User       `gorm:"foreignKey:CreatorID" json:"creator"`
	OpponentID *uuid.UUID `gorm:"type:uuid" json:"opponent_id"`
	Opponent   *User      `gorm:"foreignKey:OpponentID" json:"opponent"`
	LeetCodeID uuid.UUID  `gorm:"type:uuid;not null" json:"leetcode_id"`
	LeetCode   LeetCode   `gorm:"foreignKey:LeetCodeID" json:"leetcode"`
	Status     GameStatus `gorm:"type:varchar(20);not null;default:'waiting'" json:"status"`
	WinnerID   *uuid.UUID `gorm:"type:uuid" json:"winner_id"`
	Winner     *User      `gorm:"foreignKey:WinnerID" json:"winner"`
	StartedAt  *time.Time `json:"started_at"`
	EndedAt    *time.Time `json:"ended_at"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

// BeforeCreate UUID 생성을 위한 GORM 훅
func (g *Game) BeforeCreate(tx *gorm.DB) error {
	if g.ID == uuid.Nil {
		g.ID = uuid.New()
	}
	return nil
}

// CreateGameRequest 게임 방 생성 요청 DTO
type CreateGameRequest struct {
	LeetCodeID uuid.UUID `json:"leetcode_id" binding:"required"`
}

// GameResponse 게임 정보 응답 DTO
type GameResponse struct {
	ID          uuid.UUID       `json:"id"`
	Creator     *UserResponse   `json:"creator"`
	Opponent    *UserResponse   `json:"opponent,omitempty"`
	LeetCode    *LeetCodeDetail `json:"leetcode"`
	Status      GameStatus      `json:"status"`
	Winner      *UserResponse   `json:"winner,omitempty"`
	StartedAt   *time.Time      `json:"started_at,omitempty"`
	EndedAt     *time.Time      `json:"ended_at,omitempty"`
	CreatedAt   time.Time       `json:"created_at"`
	PlayerCount int             `json:"player_count"`
	IsFull      bool            `json:"is_full"`
}

// ToResponse Game 모델을 GameResponse DTO로 변환
func (g *Game) ToResponse() *GameResponse {
	var creatorResponse *UserResponse
	if g.Creator.ID != uuid.Nil {
		creatorResponse = g.Creator.ToResponse()
	}

	var opponentResponse *UserResponse
	if g.Opponent != nil && g.Opponent.ID != uuid.Nil {
		opponentResponse = g.Opponent.ToResponse()
	}

	var winnerResponse *UserResponse
	if g.Winner != nil && g.Winner.ID != uuid.Nil {
		winnerResponse = g.Winner.ToResponse()
	}

	leetcodeResponse := g.LeetCode.ToDetailResponse()

	playerCount := 1
	if g.Opponent != nil && g.Opponent.ID != uuid.Nil {
		playerCount = 2
	}

	isFull := playerCount >= 2

	return &GameResponse{
		ID:          g.ID,
		Creator:     creatorResponse,
		Opponent:    opponentResponse,
		LeetCode:    leetcodeResponse,
		Status:      g.Status,
		Winner:      winnerResponse,
		StartedAt:   g.StartedAt,
		EndedAt:     g.EndedAt,
		CreatedAt:   g.CreatedAt,
		PlayerCount: playerCount,
		IsFull:      isFull,
	}
}

// GameListResponse 게임 방 목록 응답 DTO
type GameListResponse struct {
	ID          uuid.UUID        `json:"id"`
	Creator     *UserResponse    `json:"creator"`
	LeetCode    *LeetCodeSummary `json:"leetcode"`
	Status      GameStatus       `json:"status"`
	PlayerCount int              `json:"player_count"`
	IsFull      bool             `json:"is_full"`
	CreatedAt   time.Time        `json:"created_at"`
}

// ToListResponse Game 모델을 GameListResponse DTO로 변환
func (g *Game) ToListResponse() *GameListResponse {
	var creatorResponse *UserResponse
	if g.Creator.ID != uuid.Nil {
		creatorResponse = g.Creator.ToResponse()
	}

	leetcodeResponse := g.LeetCode.ToSummaryResponse()

	playerCount := 1
	if g.Opponent != nil && g.Opponent.ID != uuid.Nil {
		playerCount = 2
	}

	isFull := playerCount >= 2

	return &GameListResponse{
		ID:          g.ID,
		Creator:     creatorResponse,
		LeetCode:    leetcodeResponse,
		Status:      g.Status,
		PlayerCount: playerCount,
		IsFull:      isFull,
		CreatedAt:   g.CreatedAt,
	}
}

// SubmitSolutionRequest 코드 제출 요청 DTO
type SubmitSolutionRequest struct {
	Code     string `json:"code" binding:"required"`
	Language string `json:"language" binding:"required"`
}

// JoinGameResponse 게임 방 참가 응답 DTO
type JoinGameResponse struct {
	Game *GameResponse `json:"game"`
}

// SubmitSolutionResponse 코드 제출 응답 DTO
type SubmitSolutionResponse struct {
	Success  bool   `json:"success"`
	Message  string `json:"message"`
	IsWinner bool   `json:"is_winner"`
}
