package repository

import (
	"errors"

	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type userRepository struct {
	db     *gorm.DB
	logger logger.Logger
}

func NewUserRepository(db *gorm.DB, logger logger.Logger) interfaces.UserRepository {
	return &userRepository{
		db:     db,
		logger: logger,
	}
}

func (r *userRepository) Create(user *model.User) error {
	// check if email already exists
	var count int64
	if err := r.db.Model(&model.User{}).Where("email = ?", user.Email).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return errors.New("email already exists")
	}

	return r.db.Create(user).Error
}

func (r *userRepository) FindByID(id uuid.UUID) (*model.User, error) {
	var user model.User
	err := r.db.Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

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

func (r *userRepository) Update(user *model.User) error {
	return r.db.Save(user).Error
}

func (r *userRepository) ListUsers(offset int, limit int, orderByField string, orderDir string) ([]*model.User, int64, error) {
	var users []*model.User
	var total int64

	if err := r.db.Model(&model.User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// whitelist fields to avoid SQL injection
	allowed := map[string]string{
		"created_at": "created_at",
		"name":       "name",
		"email":      "email",
		"role":       "role",
	}
	field, ok := allowed[orderByField]
	if !ok || field == "" {
		field = "created_at"
	}
	dir := "DESC"
	if orderDir == "asc" || orderDir == "ASC" {
		dir = "ASC"
	}

	if err := r.db.
		Order(field + " " + dir).
		Order("id " + dir).
		Offset(offset).Limit(limit).
		Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}
