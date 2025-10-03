package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// MatchStatus 게임 상태를 표현하는 enum
type MatchStatus string

const (
	MatchStatusWaiting  MatchStatus = "waiting"  // 상대방을 기다리는 중
	MatchStatusPlaying  MatchStatus = "playing"  // 게임 진행 중
	MatchStatusFinished MatchStatus = "finished" // 게임 종료
	MatchStatusClosed   MatchStatus = "closed"   // 방장이 닫은 상태
)

type MatchMode string

const (
	MatchModeRankedPVP MatchMode = "ranked_pvp"
	MatchModeCasualPVP MatchMode = "casual_pvp"
	MatchModeSingle    MatchMode = "single"
)

type Match struct {
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`

	PlayerAID uuid.UUID `gorm:"type:uuid;not null;index" json:"player_a_id"`
	PlayerA   User      `gorm:"foreignKey:PlayerAID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"player_a"`

	PlayerBID *uuid.UUID `gorm:"type:uuid;index" json:"player_b_id"`
	PlayerB   *User      `gorm:"foreignKey:PlayerBID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"player_b,omitempty"`

	LeetCodeID uuid.UUID `gorm:"type:uuid;not null;index" json:"leetcode_id"`
	LeetCode   LeetCode  `gorm:"foreignKey:LeetCodeID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"leetcode"`

	WinnerID *uuid.UUID `gorm:"type:uuid;index" json:"winner_id,omitempty"`
	Winner   *User      `gorm:"foreignKey:WinnerID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"winner,omitempty"`

	Mode   MatchMode   `gorm:"type:varchar(20);not null;default:'casual_pvp'" json:"mode"`
	Status MatchStatus `gorm:"type:varchar(20);not null;default:'waiting';index" json:"status"`

	StartedAt *time.Time `json:"started_at,omitempty"`
	EndedAt   *time.Time `json:"ended_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

// BeforeCreate UUID 생성을 위한 GORM 훅
func (m *Match) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

// 응답 DTO
type MatchResponse struct {
	ID        uuid.UUID       `json:"id"`
	Mode      MatchMode       `gorm:"type:varchar(20);not null;default:'casual_pvp'" json:"mode"`
	PlayerA   *UserResponse   `json:"player_a"`
	PlayerB   *UserResponse   `json:"player_b,omitempty"`
	LeetCode  *LeetCodeDetail `json:"leetcode"`
	Status    MatchStatus     `json:"status"`
	Winner    *UserResponse   `json:"winner,omitempty"`
	StartedAt *time.Time      `json:"started_at,omitempty"`
	EndedAt   *time.Time      `json:"ended_at,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
}

// Match → MatchResponse 변환
func (m *Match) ToResponse() *MatchResponse {
	var playerAResp *UserResponse
	if m.PlayerA.ID != uuid.Nil {
		playerAResp = m.PlayerA.ToResponse()
	}

	var playerBResp *UserResponse
	if m.PlayerB != nil && m.PlayerB.ID != uuid.Nil {
		playerBResp = m.PlayerB.ToResponse()
	}

	var winnerResp *UserResponse
	if m.Winner != nil && m.Winner.ID != uuid.Nil {
		winnerResp = m.Winner.ToResponse()
	}

	leetcodeResp := m.LeetCode.ToDetailResponse()

	return &MatchResponse{
		ID:        m.ID,
		PlayerA:   playerAResp,
		PlayerB:   playerBResp,
		LeetCode:  leetcodeResp,
		Status:    m.Status,
		Winner:    winnerResp,
		StartedAt: m.StartedAt,
		EndedAt:   m.EndedAt,
		CreatedAt: m.CreatedAt,
	}
}

// SubmitSolutionRequest 코드 제출 요청 DTO
type SubmitSolutionRequest struct {
	Code     string `json:"code" binding:"required"`
	Language string `json:"language" binding:"required"`
}

// SubmitSolutionResponse 코드 제출 응답 DTO
type SubmitSolutionResponse struct {
	Success  bool   `json:"success"`
	Message  string `json:"message"`
	IsWinner bool   `json:"is_winner"`
}
