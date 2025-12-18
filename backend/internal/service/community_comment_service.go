package service

import (
	"errors"

	"github.com/Dongmoon29/code_racer/internal/apperr"
	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type postCommentService struct {
	commentRepo interfaces.PostCommentRepository
	logger      logger.Logger
}

func NewPostCommentService(commentRepo interfaces.PostCommentRepository, logger logger.Logger) interfaces.PostCommentService {
	return &postCommentService{
		commentRepo: commentRepo,
		logger:      logger,
	}
}

func (s *postCommentService) CreateComment(userID, postID uuid.UUID, req *model.CreatePostCommentRequest) (*model.PostCommentResponse, error) {
	comment := &model.PostComment{
		PostID:   postID,
		UserID:   userID,
		Content:  req.Content,
		ParentID: req.ParentID,
	}

	// If parent_id is provided, verify it exists and belongs to the same post
	if req.ParentID != nil {
		parent, err := s.commentRepo.FindByID(*req.ParentID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, apperr.Wrap(err, apperr.CodeNotFound, "Parent comment not found")
			}
			return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to verify parent comment")
		}
		if parent.PostID != postID {
			return nil, apperr.New(apperr.CodeBadRequest, "Parent comment must belong to the same post")
		}
	}

	if err := s.commentRepo.Create(comment); err != nil {
		s.logger.Error().Err(err).Str("userID", userID.String()).Str("postID", postID.String()).Msg("Failed to create comment")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to create comment")
	}

	// Reload to get user relation
	created, err := s.commentRepo.FindByID(comment.ID)
	if err != nil {
		s.logger.Error().Err(err).Str("commentID", comment.ID.String()).Msg("Failed to reload comment")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to load created comment")
	}

	return created.ToResponse(), nil
}

func (s *postCommentService) GetCommentsByPostID(postID uuid.UUID, limit, offset int) ([]*model.PostCommentResponse, int64, error) {
	comments, total, err := s.commentRepo.FindByPostID(postID, limit, offset)
	if err != nil {
		s.logger.Error().Err(err).Str("postID", postID.String()).Msg("Failed to get comments")
		return nil, 0, apperr.Wrap(err, apperr.CodeInternal, "Failed to get comments")
	}

	responses := make([]*model.PostCommentResponse, len(comments))
	for i, c := range comments {
		responses[i] = c.ToResponse()
	}

	return responses, total, nil
}

func (s *postCommentService) GetCommentsByPostIDWithReplies(postID uuid.UUID, viewerID uuid.UUID) ([]*model.PostCommentResponse, error) {
	comments, err := s.commentRepo.FindByPostIDWithRepliesWithMeta(postID, &viewerID)
	if err != nil {
		s.logger.Error().Err(err).Str("postID", postID.String()).Msg("Failed to get comments with replies")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to get comments with replies")
	}

	responses := make([]*model.PostCommentResponse, len(comments))
	for i, c := range comments {
		responses[i] = c.ToResponse()
	}

	return responses, nil
}

func (s *postCommentService) UpdateComment(id, userID uuid.UUID, content string) (*model.PostCommentResponse, error) {
	comment, err := s.commentRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.Wrap(err, apperr.CodeNotFound, "Comment not found")
		}
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to get comment")
	}

	// Check if user owns the comment
	if comment.UserID != userID {
		return nil, apperr.New(apperr.CodeForbidden, "You can only update your own comments")
	}

	comment.Content = content
	if err := s.commentRepo.Update(comment); err != nil {
		s.logger.Error().Err(err).Str("commentID", id.String()).Msg("Failed to update comment")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to update comment")
	}

	// Reload to get updated data
	updated, err := s.commentRepo.FindByID(id)
	if err != nil {
		s.logger.Error().Err(err).Str("commentID", id.String()).Msg("Failed to reload comment")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to reload comment")
	}

	return updated.ToResponse(), nil
}

func (s *postCommentService) DeleteComment(id, userID uuid.UUID) error {
	comment, err := s.commentRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperr.Wrap(err, apperr.CodeNotFound, "Comment not found")
		}
		return apperr.Wrap(err, apperr.CodeInternal, "Failed to get comment")
	}

	// Check if user owns the comment
	if comment.UserID != userID {
		return apperr.New(apperr.CodeForbidden, "You can only delete your own comments")
	}

	if err := s.commentRepo.Delete(id); err != nil {
		s.logger.Error().Err(err).Str("commentID", id.String()).Msg("Failed to delete comment")
		return apperr.Wrap(err, apperr.CodeInternal, "Failed to delete comment")
	}

	return nil
}

func (s *postCommentService) VoteComment(userID, commentID uuid.UUID, value int16) (*model.PostCommentResponse, error) {
	if value != -1 && value != 0 && value != 1 {
		return nil, apperr.New(apperr.CodeBadRequest, "Invalid vote value")
	}

	// Ensure comment exists
	_, err := s.commentRepo.FindByID(commentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.Wrap(err, apperr.CodeNotFound, "Comment not found")
		}
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to get comment")
	}

	if err := s.commentRepo.Vote(commentID, userID, value); err != nil {
		s.logger.Error().Err(err).Str("commentID", commentID.String()).Str("userID", userID.String()).Msg("Failed to vote comment")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to vote comment")
	}

	updated, err := s.commentRepo.FindByIDWithMeta(commentID, &userID)
	if err != nil {
		s.logger.Error().Err(err).Str("commentID", commentID.String()).Msg("Failed to reload comment after vote")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to load comment")
	}

	return updated.ToResponse(), nil
}
