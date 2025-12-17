package repository

import (
	"errors"

	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type followRepository struct {
	db     *gorm.DB
	logger logger.Logger
}

func NewFollowRepository(db *gorm.DB, logger logger.Logger) interfaces.FollowRepository {
	return &followRepository{
		db:     db,
		logger: logger,
	}
}

func (r *followRepository) Follow(followerID, followingID uuid.UUID) error {
	// Prevent self-follow
	if followerID == followingID {
		return errors.New("cannot follow yourself")
	}

	// Check if already following
	var count int64
	if err := r.db.Model(&model.Follow{}).
		Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return errors.New("already following")
	}

	// Create follow relationship
	follow := &model.Follow{
		FollowerID:  followerID,
		FollowingID: followingID,
	}

	return r.db.Create(follow).Error
}

func (r *followRepository) Unfollow(followerID, followingID uuid.UUID) error {
	result := r.db.Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Delete(&model.Follow{})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("not following")
	}

	return nil
}

func (r *followRepository) IsFollowing(followerID, followingID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&model.Follow{}).
		Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Count(&count).Error

	return count > 0, err
}

func (r *followRepository) GetFollowStats(userID uuid.UUID, currentUserID *uuid.UUID) (*model.FollowStats, error) {
	stats := &model.FollowStats{
		UserID: userID,
	}

	// Count followers
	if err := r.db.Model(&model.Follow{}).
		Where("following_id = ?", userID).
		Count(&stats.Followers).Error; err != nil {
		return nil, err
	}

	// Count following
	if err := r.db.Model(&model.Follow{}).
		Where("follower_id = ?", userID).
		Count(&stats.Following).Error; err != nil {
		return nil, err
	}

	// Check if current user is following this user
	if currentUserID != nil {
		isFollowing, err := r.IsFollowing(*currentUserID, userID)
		if err != nil {
			return nil, err
		}
		stats.IsFollowing = isFollowing
	}

	return stats, nil
}

func (r *followRepository) GetFollowers(userID uuid.UUID, limit, offset int) ([]*model.User, int64, error) {
	var users []*model.User
	var total int64

	// Count total
	if err := r.db.Model(&model.Follow{}).
		Where("following_id = ?", userID).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get followers
	if err := r.db.Model(&model.User{}).
		Joins("INNER JOIN follows ON users.id = follows.follower_id").
		Where("follows.following_id = ?", userID).
		Order("follows.created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (r *followRepository) GetFollowing(userID uuid.UUID, limit, offset int) ([]*model.User, int64, error) {
	var users []*model.User
	var total int64

	// Count total
	if err := r.db.Model(&model.Follow{}).
		Where("follower_id = ?", userID).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get following
	if err := r.db.Model(&model.User{}).
		Joins("INNER JOIN follows ON users.id = follows.following_id").
		Where("follows.follower_id = ?", userID).
		Order("follows.created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

