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

func (r *communityRepository) FindByIDWithMeta(id uuid.UUID, viewerID *uuid.UUID) (*model.Post, error) {
	var post model.Post

	selectSQL := `
posts.*,
COALESCE((SELECT SUM(value) FROM post_votes pv WHERE pv.post_id = posts.id), 0) AS score,
COALESCE((SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = posts.id), 0) AS comment_count
`
	args := []any{}
	if viewerID != nil {
		selectSQL += `,
COALESCE((SELECT value FROM post_votes pv2 WHERE pv2.post_id = posts.id AND pv2.user_id = ?), 0) AS my_vote
`
		args = append(args, *viewerID)
	} else {
		selectSQL += `,
0 AS my_vote
`
	}

	err := r.db.Model(&model.Post{}).
		Preload("User").
		Select(selectSQL, args...).
		Where("posts.id = ?", id).
		First(&post).Error
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

func (r *communityRepository) ListAllWithMeta(limit, offset int, status *model.PostStatus, postType *model.PostType, sort model.PostSort, viewerID *uuid.UUID) ([]*model.Post, int64, error) {
	var posts []*model.Post
	var total int64

	base := r.db.Model(&model.Post{})

	if status != nil {
		base = base.Where("status = ?", *status)
	}

	if postType != nil {
		base = base.Where("type = ?", *postType)
	}

	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	selectSQL := `
posts.*,
COALESCE((SELECT SUM(value) FROM post_votes pv WHERE pv.post_id = posts.id), 0) AS score,
COALESCE((SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = posts.id), 0) AS comment_count
`
	args := []any{}
	if viewerID != nil {
		selectSQL += `,
COALESCE((SELECT value FROM post_votes pv2 WHERE pv2.post_id = posts.id AND pv2.user_id = ?), 0) AS my_vote
`
		args = append(args, *viewerID)
	} else {
		selectSQL += `,
0 AS my_vote
`
	}

	query := base.
		Preload("User").
		Select(selectSQL, args...)

	switch sort {
	case model.PostSortNew:
		query = query.Order("posts.created_at DESC")
	case model.PostSortTop:
		// Use the full subquery for score in ORDER BY
		query = query.Order("(SELECT COALESCE(SUM(value), 0) FROM post_votes pv WHERE pv.post_id = posts.id) DESC").Order("posts.created_at DESC")
	case model.PostSortHot, "":
		// Simple hot ranking: score / (ageHours + 2)^1.5
		// Use the full subquery for score in ORDER BY
		scoreSubquery := "(SELECT COALESCE(SUM(value), 0) FROM post_votes pv WHERE pv.post_id = posts.id)"
		query = query.
			Order("(" + scoreSubquery + "::float8 / pow((extract(epoch from (now() - posts.created_at)) / 3600) + 2, 1.5)) DESC").
			Order("posts.created_at DESC")
	default:
		// Fallback to hot
		scoreSubquery := "(SELECT COALESCE(SUM(value), 0) FROM post_votes pv WHERE pv.post_id = posts.id)"
		query = query.
			Order("(" + scoreSubquery + "::float8 / pow((extract(epoch from (now() - posts.created_at)) / 3600) + 2, 1.5)) DESC").
			Order("posts.created_at DESC")
	}

	err := query.
		Offset(offset).
		Limit(limit).
		Find(&posts).Error

	if err != nil {
		return nil, 0, err
	}

	return posts, total, nil
}

func (r *communityRepository) Vote(postID, userID uuid.UUID, value int16) error {
	if value == 0 {
		return r.db.Exec(
			"DELETE FROM post_votes WHERE post_id = ? AND user_id = ?",
			postID, userID,
		).Error
	}

	return r.db.Exec(
		`INSERT INTO post_votes (post_id, user_id, value, created_at, updated_at)
		 VALUES (?, ?, ?, NOW(), NOW())
		 ON CONFLICT (post_id, user_id)
		 DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
		postID, userID, value,
	).Error
}

func (r *communityRepository) Update(post *model.Post) error {
	return r.db.Save(post).Error
}

func (r *communityRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.Post{}, "id = ?", id).Error
}
