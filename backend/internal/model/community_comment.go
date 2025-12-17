package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostComment struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	PostID    uuid.UUID `gorm:"type:uuid;not null" json:"post_id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`
	Content   string    `gorm:"type:text;not null" json:"content"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	Post Post `gorm:"foreignKey:PostID;references:ID" json:"post,omitempty"`
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (pc *PostComment) BeforeCreate(tx *gorm.DB) error {
	if pc.ID == uuid.Nil {
		pc.ID = uuid.New()
	}
	return nil
}

// TableName specifies the table name for GORM
func (PostComment) TableName() string {
	return "post_comments"
}

// CreatePostCommentRequest represents the request to create a comment
type CreatePostCommentRequest struct {
	Content string `json:"content" binding:"required,min=1"`
}

// PostCommentResponse represents the response for a comment
type PostCommentResponse struct {
	ID        uuid.UUID     `json:"id"`
	PostID    uuid.UUID     `json:"post_id"`
	UserID    uuid.UUID     `json:"user_id"`
	User      *UserResponse `json:"user,omitempty"`
	Content   string        `json:"content"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

func (pc *PostComment) ToResponse() *PostCommentResponse {
	resp := &PostCommentResponse{
		ID:        pc.ID,
		PostID:    pc.PostID,
		UserID:    pc.UserID,
		Content:   pc.Content,
		CreatedAt: pc.CreatedAt,
		UpdatedAt: pc.UpdatedAt,
	}

	if pc.User.ID != uuid.Nil {
		resp.User = pc.User.ToResponse()
	}

	return resp
}

