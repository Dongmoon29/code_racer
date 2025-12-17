package interfaces

import (
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
)

type CommunityRepository interface {
	Create(post *model.Post) error
	FindByID(id uuid.UUID) (*model.Post, error)
	FindByUserID(userID uuid.UUID, limit, offset int) ([]*model.Post, int64, error)
	ListAll(limit, offset int, status *model.PostStatus, postType *model.PostType) ([]*model.Post, int64, error)
	Update(post *model.Post) error
	Delete(id uuid.UUID) error
}

type CommunityService interface {
	CreatePost(userID uuid.UUID, req *model.CreatePostRequest) (*model.PostResponse, error)
	GetPostByID(id uuid.UUID) (*model.PostResponse, error)
	GetUserPosts(userID uuid.UUID, limit, offset int) ([]*model.PostResponse, int64, error)
	ListPosts(limit, offset int, status *model.PostStatus, postType *model.PostType) ([]*model.PostResponse, int64, error)
	UpdatePostStatus(id uuid.UUID, status model.PostStatus) (*model.PostResponse, error)
	DeletePost(id uuid.UUID) error
}

type PostCommentRepository interface {
	Create(comment *model.PostComment) error
	FindByPostID(postID uuid.UUID, limit, offset int) ([]*model.PostComment, int64, error)
	FindByID(id uuid.UUID) (*model.PostComment, error)
	Update(comment *model.PostComment) error
	Delete(id uuid.UUID) error
}

type PostCommentService interface {
	CreateComment(userID, postID uuid.UUID, req *model.CreatePostCommentRequest) (*model.PostCommentResponse, error)
	GetCommentsByPostID(postID uuid.UUID, limit, offset int) ([]*model.PostCommentResponse, int64, error)
	UpdateComment(id, userID uuid.UUID, content string) (*model.PostCommentResponse, error)
	DeleteComment(id, userID uuid.UUID) error
}

