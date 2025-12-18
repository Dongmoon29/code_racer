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

	query := r.db.Model(&model.PostComment{}).Where("post_id = ? AND parent_id IS NULL", postID).Preload("User")

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

func (r *postCommentRepository) FindByPostIDWithReplies(postID uuid.UUID) ([]*model.PostComment, error) {
	// Get all comments for this post
	var allComments []*model.PostComment
	err := r.db.Model(&model.PostComment{}).
		Where("post_id = ?", postID).
		Preload("User").
		Order("created_at ASC").
		Find(&allComments).Error

	if err != nil {
		return nil, err
	}

	return buildPostCommentTree(allComments), nil
}

func (r *postCommentRepository) FindByPostIDWithRepliesWithMeta(postID uuid.UUID, viewerID *uuid.UUID) ([]*model.PostComment, error) {
	// Get all comments for this post with score/my_vote
	var allComments []*model.PostComment

	selectSQL := `
post_comments.*,
COALESCE((SELECT SUM(value) FROM post_comment_votes v WHERE v.comment_id = post_comments.id), 0) AS score
`
	args := []any{}
	if viewerID != nil {
		selectSQL += `,
COALESCE((SELECT value FROM post_comment_votes v2 WHERE v2.comment_id = post_comments.id AND v2.user_id = ?), 0) AS my_vote
`
		args = append(args, *viewerID)
	} else {
		selectSQL += `,
0 AS my_vote
`
	}

	err := r.db.Model(&model.PostComment{}).
		Preload("User").
		Select(selectSQL, args...).
		Where("post_id = ?", postID).
		Order("created_at ASC").
		Find(&allComments).Error
	if err != nil {
		return nil, err
	}

	return buildPostCommentTree(allComments), nil
}

func buildPostCommentTree(allComments []*model.PostComment) []*model.PostComment {
	// Build a map of comments by ID for quick lookup (first pass)
	commentMap := make(map[uuid.UUID]*model.PostComment, len(allComments))
	for _, c := range allComments {
		if c == nil {
			continue
		}
		commentMap[c.ID] = c
		// Ensure we start with a clean slice (avoid accidentally returning previously-loaded relations)
		c.Replies = nil
	}

	// Build the tree structure (second pass)
	topLevelComments := make([]*model.PostComment, 0, len(allComments))
	for _, c := range allComments {
		if c == nil {
			continue
		}
		if c.ParentID == nil {
			topLevelComments = append(topLevelComments, c)
			continue
		}
		if parent := commentMap[*c.ParentID]; parent != nil {
			parent.Replies = append(parent.Replies, c)
		}
	}

	return topLevelComments
}

func (r *postCommentRepository) FindByID(id uuid.UUID) (*model.PostComment, error) {
	var comment model.PostComment
	err := r.db.Preload("User").Where("id = ?", id).First(&comment).Error
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

func (r *postCommentRepository) FindByIDWithMeta(id uuid.UUID, viewerID *uuid.UUID) (*model.PostComment, error) {
	var comment model.PostComment

	selectSQL := `
post_comments.*,
COALESCE((SELECT SUM(value) FROM post_comment_votes v WHERE v.comment_id = post_comments.id), 0) AS score
`
	args := []any{}
	if viewerID != nil {
		selectSQL += `,
COALESCE((SELECT value FROM post_comment_votes v2 WHERE v2.comment_id = post_comments.id AND v2.user_id = ?), 0) AS my_vote
`
		args = append(args, *viewerID)
	} else {
		selectSQL += `,
0 AS my_vote
`
	}

	err := r.db.Model(&model.PostComment{}).
		Preload("User").
		Select(selectSQL, args...).
		Where("post_comments.id = ?", id).
		First(&comment).Error
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

func (r *postCommentRepository) Vote(commentID, userID uuid.UUID, value int16) error {
	if value == 0 {
		return r.db.Exec(
			"DELETE FROM post_comment_votes WHERE comment_id = ? AND user_id = ?",
			commentID, userID,
		).Error
	}

	return r.db.Exec(
		`INSERT INTO post_comment_votes (comment_id, user_id, value, created_at, updated_at)
		 VALUES (?, ?, ?, NOW(), NOW())
		 ON CONFLICT (comment_id, user_id)
		 DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
		commentID, userID, value,
	).Error
}

func (r *postCommentRepository) Update(comment *model.PostComment) error {
	return r.db.Save(comment).Error
}

func (r *postCommentRepository) Delete(id uuid.UUID) error {
	return r.db.Delete(&model.PostComment{}, "id = ?", id).Error
}
