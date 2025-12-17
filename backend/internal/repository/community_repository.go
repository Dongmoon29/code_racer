package repository

import (
	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type communityRepository struct {
	db     *gorm.DB
	logger logger.Logger
}

func NewCommunityRepository(db *gorm.DB, logger logger.Logger) interfaces.CommunityRepository {
	return &communityRepository{
		db:     db,
		logger: logger,
	}
}

func (r *communityRepository) Create(post *model.Post) error {
	return r.db.Create(post).Error
}

func (r *communityRepository) FindByID(id uuid.UUID) (*model.Post, error) {
	var post model.Post
	err := r.db.Preload("User").Where("id = ?", id).First(&post).Error
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *communityRepository) FindByUserID(userID uuid.UUID, limit, offset int) ([]*model.Post, int64, error) {
	var posts []*model.Post
	var total int64

	query := r.db.Model(&model.Post{}).Where("user_id = ?", userID)
	
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&posts).Error

	if err != nil {
		return nil, 0, err
	}

	return posts, total, nil
}

func (r *communityRepository) ListAll(limit, offset int, status *model.PostStatus, postType *model.PostType) ([]*model.Post, int64, error) {
	var posts []*model.Post
	var total int64

	query := r.db.Model(&model.Post{}).Preload("User")

	if status != nil {
		query = query.Where("status = ?", *status)
	}

	if postType != nil {
		query = query.Where("type = ?", *postType)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&posts).Error

	if err != nil {
		return nil, 0, err
	}

	return posts, total, nil
}

func (r *communityRepository) Update(post *model.Post) error {
	return r.db.Save(post).Error
}

func (r *communityRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Post{}, "id = ?", id).Error
}

