package repository

import (
	"errors"
	"time"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type GameRepository interface {
	Create(game *model.Game) error
	FindByID(id uuid.UUID) (*model.Game, error)
	FindOpenGames() ([]model.Game, error)
	Update(game *model.Game) error
	JoinGame(gameID uuid.UUID, userID uuid.UUID) (*model.Game, error)
	SetWinner(gameID uuid.UUID, userID uuid.UUID) error
	FindByUserID(userID uuid.UUID) ([]model.Game, error)
	CloseGame(gameID uuid.UUID, creatorID uuid.UUID) error
	Delete(id uuid.UUID) error
}

type gameRepository struct {
	db     *gorm.DB
	logger logger.Logger
}

func NewGameRepository(db *gorm.DB, logger logger.Logger) GameRepository {
	return &gameRepository{
		db:     db,
		logger: logger,
	}
}

func (r *gameRepository) Create(game *model.Game) error {
	return r.db.Create(game).Error
}

func (r *gameRepository) FindByID(id uuid.UUID) (*model.Game, error) {
	var game model.Game
	err := r.db.
		Preload("Creator").
		Preload("Opponent").
		Preload("Winner").
		Preload("LeetCode").
		Where("id = ?", id).
		First(&game).Error
	if err != nil {
		return nil, err
	}
	return &game, nil
}

func (r *gameRepository) FindOpenGames() ([]model.Game, error) {
	var games []model.Game
	err := r.db.
		Preload("Creator").
		Preload("LeetCode").
		Where("status = ?", model.GameStatusWaiting).
		Order("created_at DESC").
		Find(&games).Error
	if err != nil {
		return nil, err
	}
	return games, nil
}

func (r *gameRepository) Update(game *model.Game) error {
	return r.db.Save(game).Error
}

func (r *gameRepository) JoinGame(gameID uuid.UUID, userID uuid.UUID) (*model.Game, error) {
	var game model.Game
	err := r.db.
		Preload("Creator").
		Preload("LeetCode").
		Where("id = ?", gameID).
		First(&game).Error
	if err != nil {
		return nil, err
	}

	// check if game is in waiting status
	if game.Status != model.GameStatusWaiting {
		return nil, errors.New("game is not in waiting status")
	}

	// check if user is already in the game
	if game.CreatorID == userID {
		return nil, errors.New("you are the creator of this game")
	}

	// check if there is already an opponent
	if game.OpponentID != nil {
		return nil, errors.New("game is already full")
	}

	// start transaction
	tx := r.db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}

	// set opponent and update game status
	now := time.Now()
	game.OpponentID = &userID
	game.Status = model.GameStatusPlaying
	game.StartedAt = &now

	if err := tx.Save(&game).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// load opponent user info
	var opponent model.User
	if err := tx.Where("id = ?", userID).First(&opponent).Error; err != nil {
		tx.Rollback()
		return nil, err
	}
	game.Opponent = &opponent

	// commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return &game, nil
}

func (r *gameRepository) SetWinner(gameID uuid.UUID, userID uuid.UUID) error {
	var game model.Game
	err := r.db.Where("id = ?", gameID).First(&game).Error
	if err != nil {
		return err
	}

	// check if game is in playing status
	if game.Status != model.GameStatusPlaying {
		return errors.New("game is not in playing status")
	}

	// start transaction
	tx := r.db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	// set winner and update game status
	now := time.Now()
	game.WinnerID = &userID
	game.Status = model.GameStatusFinished
	game.EndedAt = &now

	if err := tx.Save(&game).Error; err != nil {
		tx.Rollback()
		return err
	}

	// commit transaction
	if err := tx.Commit().Error; err != nil {
		return err
	}

	return nil
}

func (r *gameRepository) FindByUserID(userID uuid.UUID) ([]model.Game, error) {
	var games []model.Game
	err := r.db.
		Preload("Creator").
		Preload("Opponent").
		Preload("Winner").
		Preload("LeetCode").
		Where("creator_id = ? OR opponent_id = ?", userID, userID).
		Order("created_at DESC").
		Find(&games).Error
	if err != nil {
		return nil, err
	}
	return games, nil
}

func (r *gameRepository) CloseGame(gameID uuid.UUID, creatorID uuid.UUID) error {
	result := r.db.Model(&model.Game{}).
		Where("id = ? AND creator_id = ? AND status = ?", gameID, creatorID, model.GameStatusWaiting).
		Update("status", model.GameStatusClosed)

	if result.RowsAffected == 0 {
		return errors.New("game not found or not in waiting status or not the creator")
	}

	return result.Error
}

func (r *gameRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Game{}, "id = ?", id).Error
}
