package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PostType string

const (
	PostTypeBug         PostType = "bug"
	PostTypeFeature     PostType = "feature"
	PostTypeImprovement PostType = "improvement"
	PostTypeOther       PostType = "other"
)

type PostStatus string

const (
	PostStatusPending    PostStatus = "pending"
	PostStatusInProgress PostStatus = "in_progress"
	PostStatusResolved   PostStatus = "resolved"
	PostStatusClosed     PostStatus = "closed"
)

type PostSort string

const (
	PostSortHot PostSort = "hot"
	PostSortNew PostSort = "new"
	PostSortTop PostSort = "top"
)

type Post struct {
	ID        uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	Type      PostType   `gorm:"type:varchar(20);not null" json:"type"`
	Title     string     `gorm:"type:varchar(255);not null" json:"title"`
	Content   string     `gorm:"type:text;not null" json:"content"`
	Status    PostStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`

	// Aggregated fields (read-only, computed in queries)
	Score        int64 `gorm:"column:score;->" json:"score"`
	CommentCount int64 `gorm:"column:comment_count;->" json:"comment_count"`
	MyVote       int16 `gorm:"column:my_vote;->" json:"my_vote"`

	// Relations
	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (p *Post) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// TableName specifies the table name for GORM
func (Post) TableName() string {
	return "posts"
}

// CreatePostRequest represents the request to create a post
type CreatePostRequest struct {
	Type    PostType `json:"type" binding:"required,oneof=bug feature improvement other"`
	Title   string   `json:"title" binding:"required,min=1,max=255"`
	Content string   `json:"content" binding:"required,min=1"`
}

// PostResponse represents the response for a post
type PostResponse struct {
	ID           uuid.UUID     `json:"id"`
	UserID       uuid.UUID     `json:"user_id"`
	User         *UserResponse `json:"user,omitempty"`
	Type         PostType      `json:"type"`
	Title        string        `json:"title"`
	Content      string        `json:"content"`
	Status       PostStatus    `json:"status"`
	Score        int64         `json:"score"`
	CommentCount int64         `json:"comment_count"`
	MyVote       int16         `json:"my_vote"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
}

func (p *Post) ToResponse() *PostResponse {
	resp := &PostResponse{
		ID:           p.ID,
		UserID:       p.UserID,
		Type:         p.Type,
		Title:        p.Title,
		Content:      p.Content,
		Status:       p.Status,
		Score:        p.Score,
		CommentCount: p.CommentCount,
		MyVote:       p.MyVote,
		CreatedAt:    p.CreatedAt,
		UpdatedAt:    p.UpdatedAt,
	}

	if p.User.ID != uuid.Nil {
		resp.User = p.User.ToResponse()
	}

	return resp
}

// VotePostRequest represents a vote action: 1(upvote), -1(downvote), 0(remove)
type VotePostRequest struct {
	Value int16 `json:"value" binding:"required,oneof=-1 0 1"`
}
