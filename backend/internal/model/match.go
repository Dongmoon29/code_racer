package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MatchStatus string

const (
	MatchStatusWaiting  MatchStatus = "waiting"  // Waiting for opponent
	MatchStatusPlaying  MatchStatus = "playing"  // Game in progress
	MatchStatusFinished MatchStatus = "finished" // Game finished
	MatchStatusClosed   MatchStatus = "closed"   // Room closed by host
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

	ProblemID uuid.UUID `gorm:"type:uuid;not null;index" json:"problem_id"`
	Problem   Problem   `gorm:"foreignKey:ProblemID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"problem"`

	WinnerID *uuid.UUID `gorm:"type:uuid;index" json:"winner_id,omitempty"`
	Winner   *User      `gorm:"foreignKey:WinnerID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"winner,omitempty"`

	// Winner metrics captured at match completion (Judge0 execution)
	// - ExecutionTimeSeconds: average seconds across test cases (as reported by Judge0)
	// - MemoryUsageKB: average memory in KB across test cases (as reported by Judge0)
	WinnerExecutionTimeSeconds float64 `gorm:"type:double precision" json:"winner_execution_time_seconds,omitempty"`
	WinnerMemoryUsageKB        float64 `gorm:"type:double precision" json:"winner_memory_usage_kb,omitempty"`
	WinnerRatingDelta          int     `gorm:"type:integer" json:"winner_rating_delta,omitempty"`
	LoserRatingDelta           int     `gorm:"type:integer" json:"loser_rating_delta,omitempty"`

	Mode   MatchMode   `gorm:"type:varchar(20);not null;default:'casual_pvp'" json:"mode"`
	Status MatchStatus `gorm:"type:varchar(20);not null;default:'waiting';index" json:"status"`

	StartedAt *time.Time `json:"started_at,omitempty"`
	EndedAt   *time.Time `json:"ended_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (m *Match) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

type MatchResponse struct {
	ID        uuid.UUID      `json:"id"`
	Mode      MatchMode      `gorm:"type:varchar(20);not null;default:'casual_pvp'" json:"mode"`
	PlayerA   *UserResponse  `json:"player_a"`
	PlayerB   *UserResponse  `json:"player_b,omitempty"`
	Problem   *ProblemDetail `json:"problem"`
	Status    MatchStatus    `json:"status"`
	Winner    *UserResponse  `json:"winner,omitempty"`
	// Winner metrics captured at match completion (if available)
	WinnerExecutionTimeSeconds float64 `json:"winner_execution_time_seconds,omitempty"`
	WinnerMemoryUsageKB        float64 `json:"winner_memory_usage_kb,omitempty"`
	WinnerRatingDelta          int     `json:"winner_rating_delta,omitempty"`
	LoserRatingDelta           int     `json:"loser_rating_delta,omitempty"`
	StartedAt *time.Time     `json:"started_at,omitempty"`
	EndedAt   *time.Time     `json:"ended_at,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
}

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

	problemResp := m.Problem.ToDetailResponse()

	return &MatchResponse{
		ID:        m.ID,
		PlayerA:   playerAResp,
		PlayerB:   playerBResp,
		Problem:   problemResp,
		Status:    m.Status,
		Winner:    winnerResp,
		WinnerExecutionTimeSeconds: m.WinnerExecutionTimeSeconds,
		WinnerMemoryUsageKB:        m.WinnerMemoryUsageKB,
		WinnerRatingDelta:          m.WinnerRatingDelta,
		LoserRatingDelta:           m.LoserRatingDelta,
		StartedAt: m.StartedAt,
		EndedAt:   m.EndedAt,
		CreatedAt: m.CreatedAt,
	}
}

type SubmitSolutionRequest struct {
	Code     string `json:"code" binding:"required"`
	Language string `json:"language" binding:"required"`
}

type SubmitSolutionResponse struct {
	Success  bool   `json:"success"`
	Message  string `json:"message"`
	IsWinner bool   `json:"is_winner"`
}
