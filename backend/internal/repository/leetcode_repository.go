package repository

import (
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// LeetCodeRepository LeetCode 문제 관련 데이터베이스 작업을 처리하는 인터페이스
type LeetCodeRepository interface {
	FindAll() ([]model.LeetCode, error)
	FindByID(id uuid.UUID) (*model.LeetCode, error)
	Create(leetcode *model.LeetCode) error
}

// leetCodeRepository LeetCodeRepository 인터페이스 구현체
type leetCodeRepository struct {
	db     *gorm.DB
	logger logger.Logger
}

// NewLeetCodeRepository LeetCodeRepository 인스턴스 생성
func NewLeetCodeRepository(db *gorm.DB, logger logger.Logger) LeetCodeRepository {
	return &leetCodeRepository{
		db:     db,
		logger: logger,
	}
}

// FindAll 모든 LeetCode 문제 조회
func (r *leetCodeRepository) FindAll() ([]model.LeetCode, error) {
	var leetcodes []model.LeetCode
	err := r.db.Order("created_at DESC").Find(&leetcodes).Error
	if err != nil {
		return nil, err
	}
	return leetcodes, nil
}

// FindByID ID로 LeetCode 문제 조회
func (r *leetCodeRepository) FindByID(id uuid.UUID) (*model.LeetCode, error) {
	var leetcode model.LeetCode
	err := r.db.Where("id = ?", id).First(&leetcode).Error
	if err != nil {
		return nil, err
	}
	return &leetcode, nil
}

// Create 새 LeetCode 문제 생성
func (r *leetCodeRepository) Create(leetcode *model.LeetCode) error {
	return r.db.Create(leetcode).Error
}
