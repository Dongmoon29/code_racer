package repository

import (
	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type postCommentRepository struct {
	db     *gorm.DB
	logger logger.Logger
}

func NewPostCommentRepository(db *gorm.DB, logger logger.Logger) interfaces.PostCommentRepository {
	return &postCommentRepository{
		db:     db,
		logger: logger,
	}
}

func (r *postCommentRepository) Create(comment *model.PostComment) error {
	return r.db.Create(comment).Error
}

func (r *postCommentRepository) FindByPostID(postID uuid.UUID, limit, offset int) ([]*model.PostComment, int64, error) {
	var comments []*model.PostComment
	var total int64

	query := r.db.Model(&model.PostComment{}).Where("post_id = ?", postID).Preload("User")
	
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Order("created_at ASC").
		Offset(offset).
		Limit(limit).
		Find(&comments).Error

	if err != nil {
		return nil, 0, err
	}

	return comments, total, nil
}

func (r *postCommentRepository) FindByID(id uuid.UUID) (*model.PostComment, error) {
	var comment model.PostComment
	err := r.db.Preload("User").Where("id = ?", id).First(&comment).Error
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

func (r *postCommentRepository) Update(comment *model.PostComment) error {
	return r.db.Save(comment).Error
}

func (r *postCommentRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.PostComment{}, "id = ?", id).Error
}

