package repository

import (
	"errors"

	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserRepository 사용자 관련 데이터베이스 작업을 처리하는 인터페이스

// userRepository UserRepository 인터페이스 구현체
type userRepository struct {
	db     *gorm.DB
	logger logger.Logger
}

// NewUserRepository UserRepository 인스턴스 생성
func NewUserRepository(db *gorm.DB, logger logger.Logger) interfaces.UserRepository {
	return &userRepository{
		db:     db,
		logger: logger,
	}
}

// Create 새로운 사용자 생성
func (r *userRepository) Create(user *model.User) error {
	// 이메일 중복 확인
	var count int64
	if err := r.db.Model(&model.User{}).Where("email = ?", user.Email).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return errors.New("email already exists")
	}

	return r.db.Create(user).Error
}

// FindByID ID로 사용자 찾기
func (r *userRepository) FindByID(id uuid.UUID) (*model.User, error) {
	var user model.User
	err := r.db.Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByEmail 이메일로 사용자 찾기
func (r *userRepository) FindByEmail(email string) (*model.User, error) {
	var user model.User
	result := r.db.Where("email = ?", email).First(&user)
	if result.Error != nil {
		r.logger.Error().
			Str("email", email).
			Err(result.Error).
			Msg("Failed to find user by email")
		return nil, result.Error
	}
	return &user, nil
}

// Update 사용자 정보 업데이트
func (r *userRepository) Update(user *model.User) error {
	return r.db.Save(user).Error
}
