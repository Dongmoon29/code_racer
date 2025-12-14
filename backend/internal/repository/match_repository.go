package repository

import (
	"errors"
	"math"
	"time"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MatchRepository interface {
	Create(match *model.Match) error
	FindByID(id uuid.UUID) (*model.Match, error)
	FindPlayingMatchByID(id uuid.UUID) (*model.Match, error)
	Update(match *model.Match) error
	SetWinner(matchID uuid.UUID, userID uuid.UUID, executionTimeSeconds float64, memoryUsageKB float64) error
	FindByUserID(userID uuid.UUID) ([]model.Match, error)
	FindRecentByUserID(userID uuid.UUID, limit int) ([]model.Match, error)
	CloseMatch(matchID uuid.UUID, userID uuid.UUID) error
	Delete(id uuid.UUID) error
}

type matchRepository struct {
	db     *gorm.DB
	logger logger.Logger
}

func NewMatchRepository(db *gorm.DB, logger logger.Logger) MatchRepository {
	return &matchRepository{db: db, logger: logger}
}

func (r *matchRepository) Create(match *model.Match) error { return r.db.Create(match).Error }

func (r *matchRepository) FindByID(id uuid.UUID) (*model.Match, error) {
	var match model.Match
	err := r.db.
		Preload("PlayerA").
		Preload("PlayerB").
		Preload("Winner").
		Preload("Problem").
		Preload("Problem.Examples").
		Preload("Problem.TestCases").
		Preload("Problem.IOTemplates").
		Preload("Problem.IOSchema").
		Where("id = ?", id).
		First(&match).Error
	if err != nil {
		return nil, err
	}
	return &match, nil
}

// FindPlayingMatchByID returns a match only if it is currently in 'playing' status
func (r *matchRepository) FindPlayingMatchByID(id uuid.UUID) (*model.Match, error) {
	var match model.Match
	err := r.db.
		Preload("PlayerA").
		Preload("PlayerB").
		Preload("Winner").
		Preload("Problem").
		Preload("Problem.Examples").
		Preload("Problem.TestCases").
		Preload("Problem.IOTemplates").
		Preload("Problem.IOSchema").
		Where("id = ? AND status = ?", id, model.MatchStatusPlaying).
		First(&match).Error
	if err != nil {
		return nil, err
	}
	return &match, nil
}

func (r *matchRepository) FindByUserID(userID uuid.UUID) ([]model.Match, error) {
	var matches []model.Match
	err := r.db.
		Preload("PlayerA").
		Preload("PlayerB").
		Preload("Winner").
		Preload("Problem").
		Preload("Problem.Examples").
		Preload("Problem.TestCases").
		Preload("Problem.IOTemplates").
		Preload("Problem.IOSchema").
		Where("player_a_id = ? OR player_b_id = ?", userID, userID).
		Order("created_at DESC").
		Find(&matches).Error
	if err != nil {
		return nil, err
	}
	return matches, nil
}

func (r *matchRepository) FindRecentByUserID(userID uuid.UUID, limit int) ([]model.Match, error) {
	var matches []model.Match
	q := r.db.
		Preload("PlayerA").
		Preload("PlayerB").
		Preload("Winner").
		Preload("Problem").
		Preload("Problem.Examples").
		Preload("Problem.TestCases").
		Preload("Problem.IOTemplates").
		Preload("Problem.IOSchema").
		Where("(player_a_id = ? OR player_b_id = ?) AND status = ?", userID, userID, model.MatchStatusFinished).
		Order("created_at DESC")
	if limit > 0 {
		q = q.Limit(limit)
	}
	if err := q.Find(&matches).Error; err != nil {
		return nil, err
	}
	return matches, nil
}

func (r *matchRepository) Update(match *model.Match) error { return r.db.Save(match).Error }

func (r *matchRepository) SetWinner(matchID uuid.UUID, userID uuid.UUID, executionTimeSeconds float64, memoryUsageKB float64) error {
	var match model.Match
	err := r.db.Where("id = ?", matchID).First(&match).Error
	if err != nil {
		return err
	}

	// check status and participant
	if match.Status != model.MatchStatusPlaying {
		return errors.New("match is not in playing status")
	}
	if userID != match.PlayerAID && (match.PlayerBID == nil || userID != *match.PlayerBID) {
		return errors.New("user is not a participant of the match")
	}

	// start transaction
	tx := r.db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	// set winner and update status
	now := time.Now()
	match.WinnerID = &userID
	match.Status = model.MatchStatusFinished
	match.EndedAt = &now
	match.WinnerExecutionTimeSeconds = executionTimeSeconds
	// Store as whole KB to avoid fractional values from averages
	match.WinnerMemoryUsageKB = math.Round(memoryUsageKB)

	if err := tx.Save(&match).Error; err != nil {
		tx.Rollback()
		return err
	}

	// commit transaction
	if err := tx.Commit().Error; err != nil {
		return err
	}

	return nil
}

func (r *matchRepository) CloseMatch(matchID uuid.UUID, userID uuid.UUID) error {
	// Close only if user is participant and status is waiting or playing
	result := r.db.Model(&model.Match{}).
		Where("id = ? AND (player_a_id = ? OR player_b_id = ?) AND status IN (?, ?)",
			matchID, userID, userID, model.MatchStatusWaiting, model.MatchStatusPlaying).
		Update("status", model.MatchStatusClosed)

	if result.RowsAffected == 0 {
		return errors.New("match not found or not closable by user")
	}
	return result.Error
}

func (r *matchRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Match{}, "id = ?", id).Error
}
