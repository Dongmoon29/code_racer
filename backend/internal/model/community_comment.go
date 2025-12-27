package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostComment struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	PostID    uuid.UUID  `gorm:"type:uuid;not null" json:"post_id"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	ParentID  *uuid.UUID `gorm:"type:uuid" json:"parent_id,omitempty"`
	Content   string     `gorm:"type:text;not null" json:"content"`
	ThreadID  uuid.UUID  `gorm:"type:uuid;not null" json:"thread_id"`
	Depth     int         `gorm:"type:integer;not null;default:0" json:"depth"`
	Path      string      `gorm:"type:text" json:"path"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`

	// Aggregated fields (read-only, computed in queries)
	Score  int64 `gorm:"column:score;->" json:"score"`
	MyVote int16 `gorm:"column:my_vote;->" json:"my_vote"`

	// Relations
	Post    Post           `gorm:"foreignKey:PostID;references:ID" json:"post,omitempty"`
	User    User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Parent  *PostComment   `gorm:"foreignKey:ParentID;references:ID" json:"parent,omitempty"`
	Thread  *PostComment   `gorm:"foreignKey:ThreadID;references:ID" json:"thread,omitempty"`
	Replies []*PostComment `gorm:"foreignKey:ParentID" json:"replies,omitempty"`
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
	Content  string     `json:"content" binding:"required,min=1"`
	ParentID *uuid.UUID `json:"parent_id,omitempty"`
}

// PostCommentResponse represents the response for a comment
type PostCommentResponse struct {
	ID        uuid.UUID              `json:"id"`
	PostID    uuid.UUID              `json:"post_id"`
	UserID    uuid.UUID              `json:"user_id"`
	ParentID  *uuid.UUID             `json:"parent_id,omitempty"`
	ThreadID  uuid.UUID              `json:"thread_id"`
	Depth     int                    `json:"depth"`
	Path      string                 `json:"path"`
	User      *UserResponse          `json:"user,omitempty"`
	Content   string                 `json:"content"`
	Score     int64                  `json:"score"`
	MyVote    int16                  `json:"my_vote"`
	CreatedAt time.Time              `json:"created_at"`
	UpdatedAt time.Time              `json:"updated_at"`
	Replies   []*PostCommentResponse `json:"replies,omitempty"`
}

func (pc *PostComment) ToResponse() *PostCommentResponse {
	resp := &PostCommentResponse{
		ID:        pc.ID,
		PostID:    pc.PostID,
		UserID:    pc.UserID,
		ParentID:  pc.ParentID,
		ThreadID:  pc.ThreadID,
		Depth:     pc.Depth,
		Path:      pc.Path,
		Content:   pc.Content,
		Score:     pc.Score,
		MyVote:    pc.MyVote,
		CreatedAt: pc.CreatedAt,
		UpdatedAt: pc.UpdatedAt,
	}

	if pc.User.ID != uuid.Nil {
		resp.User = pc.User.ToResponse()
	}

	// Convert replies to response format
	if len(pc.Replies) > 0 {
		resp.Replies = make([]*PostCommentResponse, len(pc.Replies))
		for i, reply := range pc.Replies {
			if reply == nil {
				continue
			}
			resp.Replies[i] = reply.ToResponse()
		}
	}

	return resp
}

// VotePostCommentRequest represents a vote action: 1(upvote), -1(downvote), 0(remove)
type VotePostCommentRequest struct {
	Value int16 `json:"value" binding:"required,oneof=-1 0 1"`
}
