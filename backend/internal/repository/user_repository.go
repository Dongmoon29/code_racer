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

func (r *userRepository) ListUsers(offset int, limit int, orderByField string, orderDir string, search string) ([]*model.User, int64, error) {
	var users []*model.User
	var total int64

	// whitelist fields to avoid SQL injection
	allowed := map[string]string{
		"created_at": "created_at",
		"updated_at": "updated_at",
		"name":       "name",
		"email":      "email",
		"role":       "role",
		"rating":     "rating",
	}
	field, ok := allowed[orderByField]
	if !ok || field == "" {
		field = "created_at"
	}
	dir := "DESC"
	if orderDir == "asc" || orderDir == "ASC" {
		dir = "ASC"
	}

	// Build base query
	query := r.db.Model(&model.User{})
	countQuery := r.db.Model(&model.User{})

	// Apply search filter if provided
	if search != "" {
		searchPattern := "%" + search + "%"
		// Try to parse as UUID first (for exact ID match)
		if _, err := uuid.Parse(search); err == nil {
			// Exact match for UUID
			query = query.Where("id = ?", search)
			countQuery = countQuery.Where("id = ?", search)
		} else {
			// Search in name, email, and ID fields (ID as string for partial match)
			// Convert UUID to string for ILIKE comparison
			searchCondition := "name ILIKE ? OR email ILIKE ? OR id::text ILIKE ?"
			query = query.Where(searchCondition, searchPattern, searchPattern, searchPattern)
			countQuery = countQuery.Where(searchCondition, searchPattern, searchPattern, searchPattern)
			
			r.logger.Debug().
				Str("search", search).
				Str("searchPattern", searchPattern).
				Msg("ListUsers: applying search filter (name, email, or ID)")
		}
	}

	// Count total matching records
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	r.logger.Debug().
		Str("orderByField", orderByField).
		Str("orderDir", orderDir).
		Str("field", field).
		Str("dir", dir).
		Str("search", search).
		Int("offset", offset).
		Int("limit", limit).
		Msg("ListUsers: building query with sorting and search")

	// Primary sort by the specified field
	query = query.Order(field + " " + dir)
	
	// Secondary sort by id for consistent ordering when field values are equal
	query = query.Order("id " + dir)
	
	// Apply pagination
	query = query.Offset(offset).Limit(limit)
	
	if err := query.Find(&users).Error; err != nil {
		return nil, 0, err
	}

	r.logger.Debug().
		Int("resultCount", len(users)).
		Int64("total", total).
		Msg("ListUsers: query completed")

	return users, total, nil
}

// GetLeaderboardUsers gets users who have played ranked matches, ordered by rating
// Optimized query using UNION instead of EXISTS subqueries for better performance
func (r *userRepository) GetLeaderboardUsers(limit int) ([]*model.User, error) {
	var users []*model.User

	// Use UNION to get distinct user IDs who have played ranked matches
	// This is more efficient than EXISTS subqueries
	err := r.db.
		Where(`id IN (
			SELECT DISTINCT player_a_id FROM matches WHERE mode = 'ranked_pvp'
			UNION
			SELECT DISTINCT player_b_id FROM matches WHERE mode = 'ranked_pvp' AND player_b_id IS NOT NULL
		)`).
		Order("rating DESC").
		Order("id DESC").
		Limit(limit).
		Find(&users).Error

	if err != nil {
		return nil, err
	}

	return users, nil
}
