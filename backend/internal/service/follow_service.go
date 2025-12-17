package service

import (
	"github.com/Dongmoon29/code_racer/internal/apperr"
	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
)

type FollowService interface {
	Follow(followerID, followingID uuid.UUID) error
	Unfollow(followerID, followingID uuid.UUID) error
	GetFollowStats(userID uuid.UUID, currentUserID *uuid.UUID) (*model.FollowStats, error)
	GetFollowers(userID uuid.UUID, limit, offset int) ([]*model.User, int64, error)
	GetFollowing(userID uuid.UUID, limit, offset int) ([]*model.User, int64, error)
}

type followService struct {
	followRepo interfaces.FollowRepository
	logger     logger.Logger
}

func NewFollowService(followRepo interfaces.FollowRepository, logger logger.Logger) FollowService {
	return &followService{
		followRepo: followRepo,
		logger:     logger,
	}
}

func (s *followService) Follow(followerID, followingID uuid.UUID) error {
	// Check if user exists (basic validation)
	if followerID == uuid.Nil || followingID == uuid.Nil {
		return apperr.New(apperr.CodeBadRequest, "Invalid user ID")
	}

	err := s.followRepo.Follow(followerID, followingID)
	if err != nil {
		if err.Error() == "cannot follow yourself" {
			return apperr.New(apperr.CodeBadRequest, "Cannot follow yourself")
		}
		if err.Error() == "already following" {
			return apperr.New(apperr.CodeBadRequest, "Already following this user")
		}
		return apperr.Wrap(err, apperr.CodeInternal, "Failed to follow user")
	}

	return nil
}

func (s *followService) Unfollow(followerID, followingID uuid.UUID) error {
	if followerID == uuid.Nil || followingID == uuid.Nil {
		return apperr.New(apperr.CodeBadRequest, "Invalid user ID")
	}

	err := s.followRepo.Unfollow(followerID, followingID)
	if err != nil {
		if err.Error() == "not following" {
			return apperr.New(apperr.CodeBadRequest, "Not following this user")
		}
		return apperr.Wrap(err, apperr.CodeInternal, "Failed to unfollow user")
	}

	return nil
}

func (s *followService) GetFollowStats(userID uuid.UUID, currentUserID *uuid.UUID) (*model.FollowStats, error) {
	stats, err := s.followRepo.GetFollowStats(userID, currentUserID)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to get follow stats")
	}
	return stats, nil
}

func (s *followService) GetFollowers(userID uuid.UUID, limit, offset int) ([]*model.User, int64, error) {
	users, total, err := s.followRepo.GetFollowers(userID, limit, offset)
	if err != nil {
		return nil, 0, apperr.Wrap(err, apperr.CodeInternal, "Failed to get followers")
	}
	return users, total, nil
}

func (s *followService) GetFollowing(userID uuid.UUID, limit, offset int) ([]*model.User, int64, error) {
	users, total, err := s.followRepo.GetFollowing(userID, limit, offset)
	if err != nil {
		return nil, 0, apperr.Wrap(err, apperr.CodeInternal, "Failed to get following")
	}
	return users, total, nil
}

