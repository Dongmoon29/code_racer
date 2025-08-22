package repository

import (
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LeetCodeRepository interface {
	FindAll() ([]model.LeetCode, error)
	FindByID(id uuid.UUID) (*model.LeetCode, error)
	Create(leetcode *model.LeetCode) error
	Update(leetcode *model.LeetCode) error
	Delete(id uuid.UUID) error
	FindByDifficulty(difficulty string) ([]model.LeetCode, error)
	Search(query string) ([]model.LeetCode, error)
}

type leetCodeRepository struct {
	db     *gorm.DB
	logger logger.Logger
}

func NewLeetCodeRepository(db *gorm.DB, logger logger.Logger) LeetCodeRepository {
	return &leetCodeRepository{
		db:     db,
		logger: logger,
	}
}

func (r *leetCodeRepository) FindAll() ([]model.LeetCode, error) {
	var leetcodes []model.LeetCode
	err := r.db.Order("created_at DESC").Find(&leetcodes).Error
	if err != nil {
		return nil, err
	}
	return leetcodes, nil
}

func (r *leetCodeRepository) FindByID(id uuid.UUID) (*model.LeetCode, error) {
	var leetcode model.LeetCode
	err := r.db.Where("id = ?", id).First(&leetcode).Error
	if err != nil {
		return nil, err
	}
	return &leetcode, nil
}

func (r *leetCodeRepository) Create(leetcode *model.LeetCode) error {
	return r.db.Create(leetcode).Error
}

func (r *leetCodeRepository) Update(leetcode *model.LeetCode) error {
	return r.db.Save(leetcode).Error
}

func (r *leetCodeRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.LeetCode{}, id).Error
}

func (r *leetCodeRepository) FindByDifficulty(difficulty string) ([]model.LeetCode, error) {
	var leetcodes []model.LeetCode
	err := r.db.Where("difficulty = ?", difficulty).Order("created_at DESC").Find(&leetcodes).Error
	if err != nil {
		return nil, err
	}
	return leetcodes, nil
}

func (r *leetCodeRepository) Search(query string) ([]model.LeetCode, error) {
	var leetcodes []model.LeetCode
	searchQuery := "%" + query + "%"
	err := r.db.Where("title ILIKE ? OR description ILIKE ?", searchQuery, searchQuery).
		Order("created_at DESC").
		Find(&leetcodes).Error
	if err != nil {
		return nil, err
	}
	return leetcodes, nil
}
