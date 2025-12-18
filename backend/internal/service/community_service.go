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

type communityService struct {
	communityRepo interfaces.CommunityRepository
	logger        logger.Logger
}

func NewCommunityService(communityRepo interfaces.CommunityRepository, logger logger.Logger) interfaces.CommunityService {
	return &communityService{
		communityRepo: communityRepo,
		logger:        logger,
	}
}

func (s *communityService) CreatePost(userID uuid.UUID, req *model.CreatePostRequest) (*model.PostResponse, error) {
	post := &model.Post{
		UserID:  userID,
		Type:    req.Type,
		Title:   req.Title,
		Content: req.Content,
		Status:  model.PostStatusPending,
	}

	if err := s.communityRepo.Create(post); err != nil {
		s.logger.Error().Err(err).Str("userID", userID.String()).Msg("Failed to create post")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to create post")
	}

	// Reload to get user relation
	created, err := s.communityRepo.FindByID(post.ID)
	if err != nil {
		s.logger.Error().Err(err).Str("postID", post.ID.String()).Msg("Failed to reload post")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to load created post")
	}

	return created.ToResponse(), nil
}

func (s *communityService) GetPostByID(id uuid.UUID, viewerID uuid.UUID) (*model.PostResponse, error) {
	post, err := s.communityRepo.FindByIDWithMeta(id, &viewerID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.Wrap(err, apperr.CodeNotFound, "Post not found")
		}
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to get post")
	}

	return post.ToResponse(), nil
}

func (s *communityService) GetUserPosts(userID uuid.UUID, limit, offset int) ([]*model.PostResponse, int64, error) {
	posts, total, err := s.communityRepo.FindByUserID(userID, limit, offset)
	if err != nil {
		s.logger.Error().Err(err).Str("userID", userID.String()).Msg("Failed to get user posts")
		return nil, 0, apperr.Wrap(err, apperr.CodeInternal, "Failed to get user posts")
	}

	responses := make([]*model.PostResponse, len(posts))
	for i, p := range posts {
		responses[i] = p.ToResponse()
	}

	return responses, total, nil
}

func (s *communityService) ListPosts(viewerID uuid.UUID, limit, offset int, status *model.PostStatus, postType *model.PostType, sort model.PostSort) ([]*model.PostResponse, int64, error) {
	posts, total, err := s.communityRepo.ListAllWithMeta(limit, offset, status, postType, sort, &viewerID)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to list posts")
		return nil, 0, apperr.Wrap(err, apperr.CodeInternal, "Failed to list posts")
	}

	responses := make([]*model.PostResponse, len(posts))
	for i, p := range posts {
		responses[i] = p.ToResponse()
	}

	return responses, total, nil
}

func (s *communityService) VotePost(userID, postID uuid.UUID, value int16) (*model.PostResponse, error) {
	if value != -1 && value != 0 && value != 1 {
		return nil, apperr.New(apperr.CodeBadRequest, "Invalid vote value")
	}

	// Ensure the post exists
	_, err := s.communityRepo.FindByID(postID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.Wrap(err, apperr.CodeNotFound, "Post not found")
		}
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to get post")
	}

	if err := s.communityRepo.Vote(postID, userID, value); err != nil {
		s.logger.Error().Err(err).Str("postID", postID.String()).Str("userID", userID.String()).Msg("Failed to vote post")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to vote post")
	}

	updated, err := s.communityRepo.FindByIDWithMeta(postID, &userID)
	if err != nil {
		s.logger.Error().Err(err).Str("postID", postID.String()).Msg("Failed to reload post after vote")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to load post")
	}

	return updated.ToResponse(), nil
}

func (s *communityService) UpdatePostStatus(id uuid.UUID, status model.PostStatus) (*model.PostResponse, error) {
	post, err := s.communityRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.Wrap(err, apperr.CodeNotFound, "Post not found")
		}
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to get post")
	}

	post.Status = status
	if err := s.communityRepo.Update(post); err != nil {
		s.logger.Error().Err(err).Str("postID", id.String()).Msg("Failed to update post status")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to update post status")
	}

	// Reload to get updated data
	updated, err := s.communityRepo.FindByID(id)
	if err != nil {
		s.logger.Error().Err(err).Str("postID", id.String()).Msg("Failed to reload post")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to reload post")
	}

	return updated.ToResponse(), nil
}

func (s *communityService) DeletePost(id uuid.UUID) error {
	_, err := s.communityRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return apperr.Wrap(err, apperr.CodeNotFound, "Post not found")
		}
		return apperr.Wrap(err, apperr.CodeInternal, "Failed to get post")
	}

	if err := s.communityRepo.Delete(id); err != nil {
		s.logger.Error().Err(err).Str("postID", id.String()).Msg("Failed to delete post")
		return apperr.Wrap(err, apperr.CodeInternal, "Failed to delete post")
	}

	return nil
}
