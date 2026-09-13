package repository

import (
	"errors"
	"math"
	"time"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var ErrActiveMatchExists = errors.New("user already has an active match")

type MatchRepository interface {
	Create(match *model.Match) error
	CreateExclusive(match *model.Match) error
	FindByID(id uuid.UUID) (*model.Match, error)
	FindActiveByUserID(userID uuid.UUID) (*model.Match, error)
	FindPlayingMatchByID(id uuid.UUID) (*model.Match, error)
	Update(match *model.Match) error
	SetWinner(matchID uuid.UUID, userID uuid.UUID, code, language string, executionTimeSeconds float64, memoryUsageKB float64) error
	FindByUserID(userID uuid.UUID) ([]model.Match, error)
	FindRecentByUserID(userID uuid.UUID, limit int) ([]model.Match, error)
	CloseMatch(matchID uuid.UUID, userID uuid.UUID) error
	FinishDraw(matchID uuid.UUID) (bool, error)
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

func (r *matchRepository) CreateExclusive(match *model.Match) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if match.PlayerBID != nil && match.PlayerAID == *match.PlayerBID {
			return ErrActiveMatchExists
		}
		if err := tx.Create(match).Error; err != nil {
			return err
		}

		userIDs := []uuid.UUID{match.PlayerAID}
		if match.PlayerBID != nil {
			userIDs = append(userIDs, *match.PlayerBID)
		}
		for _, userID := range userIDs {
			lock := model.ActiveMatchParticipant{UserID: userID, MatchID: match.ID}
			result := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&lock)
			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected != 1 {
				return ErrActiveMatchExists
			}
		}
		return nil
	})
}

func (r *matchRepository) FindByID(id uuid.UUID) (*model.Match, error) {
	var match model.Match
	err := r.db.
		Preload("PlayerA").
		Preload("PlayerB").
		Preload("Winner").
		Preload("Problem").
		Preload("Problem.Examples").
		Preload("Problem.TestCases").
		Preload("Problem.IOSchema").
		Where("id = ?", id).
		First(&match).Error
	if err != nil {
		return nil, err
	}
	return &match, nil
}

func (r *matchRepository) FindActiveByUserID(userID uuid.UUID) (*model.Match, error) {
	var participant model.ActiveMatchParticipant
	if err := r.db.Where("user_id = ?", userID).First(&participant).Error; err != nil {
		return nil, err
	}
	match, err := r.FindByID(participant.MatchID)
	if err != nil {
		return nil, err
	}
	if match.Status != model.MatchStatusWaiting && match.Status != model.MatchStatusPlaying {
		_ = r.db.Delete(&model.ActiveMatchParticipant{}, "user_id = ?", userID).Error
		return nil, gorm.ErrRecordNotFound
	}
	return match, nil
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
		Preload("Problem").
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

func (r *matchRepository) SetWinner(matchID uuid.UUID, userID uuid.UUID, code, language string, executionTimeSeconds float64, memoryUsageKB float64) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var match model.Match
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", matchID).First(&match).Error; err != nil {
			return err
		}
		if match.Status != model.MatchStatusPlaying {
			return errors.New("match is not in playing status")
		}
		if userID != match.PlayerAID && (match.PlayerBID == nil || userID != *match.PlayerBID) {
			return errors.New("user is not a participant of the match")
		}
		now := time.Now()
		match.WinnerID = &userID
		match.Status = model.MatchStatusFinished
		match.EndedAt = &now
		match.WinnerExecutionTimeSeconds = executionTimeSeconds
		match.WinnerMemoryUsageKB = math.Round(memoryUsageKB)
		match.WinnerLanguage = language
		match.WinnerCode = code
		if err := tx.Save(&match).Error; err != nil {
			return err
		}
		return tx.Delete(&model.ActiveMatchParticipant{}, "match_id = ?", matchID).Error
	})
}

func (r *matchRepository) CloseMatch(matchID uuid.UUID, userID uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		now := time.Now()
		result := tx.Model(&model.Match{}).
			Where("id = ? AND (player_a_id = ? OR player_b_id = ?) AND status IN (?, ?)", matchID, userID, userID, model.MatchStatusWaiting, model.MatchStatusPlaying).
			Updates(map[string]interface{}{"status": model.MatchStatusClosed, "ended_at": now})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return errors.New("match not found or not closable by user")
		}
		return tx.Delete(&model.ActiveMatchParticipant{}, "match_id = ?", matchID).Error
	})
}

func (r *matchRepository) FinishDraw(matchID uuid.UUID) (bool, error) {
	finished := false
	err := r.db.Transaction(func(tx *gorm.DB) error {
		now := time.Now()
		result := tx.Model(&model.Match{}).
			Where("id = ? AND status IN (?, ?)", matchID, model.MatchStatusWaiting, model.MatchStatusPlaying).
			Updates(map[string]interface{}{"status": model.MatchStatusFinished, "winner_id": nil, "ended_at": now})
		if result.Error != nil {
			return result.Error
		}
		finished = result.RowsAffected == 1
		if finished {
			return tx.Delete(&model.ActiveMatchParticipant{}, "match_id = ?", matchID).Error
		}
		return nil
	})
	return finished, err
}

func (r *matchRepository) Delete(id uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&model.ActiveMatchParticipant{}, "match_id = ?", id).Error; err != nil {
			return err
		}
		return tx.Delete(&model.Match{}, "id = ?", id).Error
	})
}
