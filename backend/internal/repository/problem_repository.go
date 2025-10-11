package repository

import (
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ProblemRepository represents the new normalized problem repository interface
type ProblemRepository interface {
	FindAll() ([]model.Problem, error)
	FindByID(id uuid.UUID) (*model.Problem, error)
	Create(problem *model.Problem) error
	Update(problem *model.Problem) error
	Delete(id uuid.UUID) error
	FindByDifficulty(difficulty string) ([]model.Problem, error)
	Search(query string) ([]model.Problem, error)
	FindWithRelations(id uuid.UUID) (*model.Problem, error)
}

type problemRepository struct {
	db     *gorm.DB
	logger logger.Logger
}

func NewProblemRepository(db *gorm.DB, logger logger.Logger) ProblemRepository {
	return &problemRepository{
		db:     db,
		logger: logger,
	}
}

// ========================
// ProblemRepository implementation
// ========================

func (r *problemRepository) FindAll() ([]model.Problem, error) {
	var problems []model.Problem
	err := r.db.Order("created_at DESC").Find(&problems).Error
	if err != nil {
		return nil, err
	}
	return problems, nil
}

func (r *problemRepository) FindByID(id uuid.UUID) (*model.Problem, error) {
	var problem model.Problem
	err := r.db.Where("id = ?", id).First(&problem).Error
	if err != nil {
		return nil, err
	}
	return &problem, nil
}

func (r *problemRepository) FindWithRelations(id uuid.UUID) (*model.Problem, error) {
	var problem model.Problem
	err := r.db.Preload("Examples").
		Preload("TestCases").
		Preload("IOTemplates").
		Preload("IOSchema").
		Where("id = ?", id).
		First(&problem).Error
	if err != nil {
		return nil, err
	}
	return &problem, nil
}

func (r *problemRepository) Create(problem *model.Problem) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Create Problem
		if err := tx.Create(problem).Error; err != nil {
			return err
		}

		// Create Examples
		for i := range problem.Examples {
			problem.Examples[i].ProblemID = problem.ID
		}
		if len(problem.Examples) > 0 {
			if err := tx.Create(&problem.Examples).Error; err != nil {
				return err
			}
		}

		// Create TestCases
		for i := range problem.TestCases {
			problem.TestCases[i].ProblemID = problem.ID
		}
		if len(problem.TestCases) > 0 {
			if err := tx.Create(&problem.TestCases).Error; err != nil {
				return err
			}
		}

		// Create IOTemplates
		for i := range problem.IOTemplates {
			problem.IOTemplates[i].ProblemID = problem.ID
		}
		if len(problem.IOTemplates) > 0 {
			if err := tx.Create(&problem.IOTemplates).Error; err != nil {
				return err
			}
		}

		// Create IOSchema
		problem.IOSchema.ProblemID = problem.ID
		if err := tx.Create(&problem.IOSchema).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *problemRepository) Update(problem *model.Problem) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Update Problem
		if err := tx.Save(problem).Error; err != nil {
			return err
		}

		// Delete existing related data
		if err := tx.Where("problem_id = ?", problem.ID).Delete(&model.Example{}).Error; err != nil {
			return err
		}
		if err := tx.Where("problem_id = ?", problem.ID).Delete(&model.TestCase{}).Error; err != nil {
			return err
		}
		if err := tx.Where("problem_id = ?", problem.ID).Delete(&model.IOTemplate{}).Error; err != nil {
			return err
		}
		if err := tx.Where("problem_id = ?", problem.ID).Delete(&model.IOSchema{}).Error; err != nil {
			return err
		}

		// Create new related data
		for i := range problem.Examples {
			problem.Examples[i].ProblemID = problem.ID
		}
		if len(problem.Examples) > 0 {
			if err := tx.Create(&problem.Examples).Error; err != nil {
				return err
			}
		}

		for i := range problem.TestCases {
			problem.TestCases[i].ProblemID = problem.ID
		}
		if len(problem.TestCases) > 0 {
			if err := tx.Create(&problem.TestCases).Error; err != nil {
				return err
			}
		}

		for i := range problem.IOTemplates {
			problem.IOTemplates[i].ProblemID = problem.ID
		}
		if len(problem.IOTemplates) > 0 {
			if err := tx.Create(&problem.IOTemplates).Error; err != nil {
				return err
			}
		}

		problem.IOSchema.ProblemID = problem.ID
		if err := tx.Create(&problem.IOSchema).Error; err != nil {
			return err
		}

		return nil
	})
}

func (r *problemRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Problem{}, id).Error
}

func (r *problemRepository) FindByDifficulty(difficulty string) ([]model.Problem, error) {
	var problems []model.Problem
	err := r.db.Where("difficulty = ?", difficulty).Order("created_at DESC").Find(&problems).Error
	if err != nil {
		return nil, err
	}
	return problems, nil
}

func (r *problemRepository) Search(query string) ([]model.Problem, error) {
	var problems []model.Problem
	searchQuery := "%" + query + "%"
	err := r.db.Where("title ILIKE ? OR description ILIKE ?", searchQuery, searchQuery).
		Order("created_at DESC").
		Find(&problems).Error
	if err != nil {
		return nil, err
	}
	return problems, nil
}
