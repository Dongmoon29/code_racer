package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Follow represents a follow relationship between two users
type Follow struct {
	FollowerID  uuid.UUID `gorm:"type:uuid;primaryKey" json:"follower_id"`
	FollowingID uuid.UUID `gorm:"type:uuid;primaryKey" json:"following_id"`
	CreatedAt   time.Time `json:"created_at"`

	// Relations
	Follower  User `gorm:"foreignKey:FollowerID" json:"-"`
	Following User `gorm:"foreignKey:FollowingID" json:"-"`
}

func (f *Follow) BeforeCreate(tx *gorm.DB) error {
	// Ensure follower_id and following_id are set
	if f.FollowerID == uuid.Nil || f.FollowingID == uuid.Nil {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// FollowStats represents follower/following counts for a user
type FollowStats struct {
	UserID     uuid.UUID `json:"user_id"`
	Followers  int64     `json:"followers"`
	Following  int64     `json:"following"`
	IsFollowing bool     `json:"is_following"` // Whether current user is following this user
}

