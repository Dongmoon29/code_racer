package repository

import (
	"errors"
	"time"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// GameRepository 게임 관련 데이터베이스 작업을 처리하는 인터페이스
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

// gameRepository GameRepository 인터페이스 구현체
type gameRepository struct {
	db     *gorm.DB
	logger logger.Logger
}

// NewGameRepository GameRepository 인스턴스 생성
func NewGameRepository(db *gorm.DB, logger logger.Logger) GameRepository {
	return &gameRepository{
		db:     db,
		logger: logger,
	}
}

// Create 새로운 게임 방 생성
func (r *gameRepository) Create(game *model.Game) error {
	return r.db.Create(game).Error
}

// FindByID ID로 게임 방 찾기
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

// FindOpenGames 참가 가능한 오픈 게임 방 목록 조회
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

// Update 게임 방 정보 업데이트
func (r *gameRepository) Update(game *model.Game) error {
	return r.db.Save(game).Error
}

// JoinGame 게임 방 참가
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

	// 게임 상태 체크
	if game.Status != model.GameStatusWaiting {
		return nil, errors.New("game is not in waiting status")
	}

	// 이미 참가한 사용자인지 체크
	if game.CreatorID == userID {
		return nil, errors.New("you are the creator of this game")
	}

	// 이미 다른 사용자가 참가했는지 체크
	if game.OpponentID != nil {
		return nil, errors.New("game is already full")
	}

	// 트랜잭션 시작
	tx := r.db.Begin()
	if tx.Error != nil {
		return nil, tx.Error
	}

	// 상대 플레이어 설정 및 게임 상태 변경
	now := time.Now()
	game.OpponentID = &userID
	game.Status = model.GameStatusPlaying
	game.StartedAt = &now

	if err := tx.Save(&game).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// 상대 플레이어 정보 로드
	var opponent model.User
	if err := tx.Where("id = ?", userID).First(&opponent).Error; err != nil {
		tx.Rollback()
		return nil, err
	}
	game.Opponent = &opponent

	// 트랜잭션 커밋
	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return &game, nil
}

// SetWinner 게임 승자 설정
func (r *gameRepository) SetWinner(gameID uuid.UUID, userID uuid.UUID) error {
	var game model.Game
	err := r.db.Where("id = ?", gameID).First(&game).Error
	if err != nil {
		return err
	}

	// 게임 상태 체크
	if game.Status != model.GameStatusPlaying {
		return errors.New("game is not in playing status")
	}

	// 트랜잭션 시작
	tx := r.db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	// 승자 설정 및 게임 상태 변경
	now := time.Now()
	game.WinnerID = &userID
	game.Status = model.GameStatusFinished
	game.EndedAt = &now

	if err := tx.Save(&game).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 트랜잭션 커밋
	if err := tx.Commit().Error; err != nil {
		return err
	}

	return nil
}

// FindByUserID 사용자 ID로 참가한 게임 방 목록 조회
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

// CloseGame 게임 방 닫기 (대기 중인 게임만 가능)
func (r *gameRepository) CloseGame(gameID uuid.UUID, creatorID uuid.UUID) error {
	result := r.db.Model(&model.Game{}).
		Where("id = ? AND creator_id = ? AND status = ?", gameID, creatorID, model.GameStatusWaiting).
		Update("status", model.GameStatusClosed)

	if result.RowsAffected == 0 {
		return errors.New("game not found or not in waiting status or not the creator")
	}

	return result.Error
}

// Delete 게임 삭제 (롤백용)
func (r *gameRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Game{}, "id = ?", id).Error
}
