package interfaces

import (
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
)

type FollowRepository interface {
	// Follow creates a follow relationship
	Follow(followerID, followingID uuid.UUID) error
	// Unfollow removes a follow relationship
	Unfollow(followerID, followingID uuid.UUID) error
	// IsFollowing checks if followerID is following followingID
	IsFollowing(followerID, followingID uuid.UUID) (bool, error)
	// GetFollowStats returns follower/following counts and is_following status
	GetFollowStats(userID uuid.UUID, currentUserID *uuid.UUID) (*model.FollowStats, error)
	// GetFollowers returns list of users following the given user
	GetFollowers(userID uuid.UUID, limit, offset int) ([]*model.User, int64, error)
	// GetFollowing returns list of users the given user is following
	GetFollowing(userID uuid.UUID, limit, offset int) ([]*model.User, int64, error)
}

