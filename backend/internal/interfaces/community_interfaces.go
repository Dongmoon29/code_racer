package interfaces

import (
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
)

type CommunityRepository interface {
	Create(post *model.Post) error
	FindByID(id uuid.UUID) (*model.Post, error)
	FindByIDWithMeta(id uuid.UUID, viewerID *uuid.UUID) (*model.Post, error)
	FindByUserID(userID uuid.UUID, limit, offset int) ([]*model.Post, int64, error)
	ListAllWithMeta(limit, offset int, status *model.PostStatus, postType *model.PostType, sort model.PostSort, viewerID *uuid.UUID) ([]*model.Post, int64, error)
	Vote(postID, userID uuid.UUID, value int16) error
	Update(post *model.Post) error
	Delete(id uuid.UUID) error
}

type CommunityService interface {
	CreatePost(userID uuid.UUID, req *model.CreatePostRequest) (*model.PostResponse, error)
	GetPostByID(id uuid.UUID, viewerID uuid.UUID) (*model.PostResponse, error)
	GetUserPosts(userID uuid.UUID, limit, offset int) ([]*model.PostResponse, int64, error)
	ListPosts(viewerID uuid.UUID, limit, offset int, status *model.PostStatus, postType *model.PostType, sort model.PostSort) ([]*model.PostResponse, int64, error)
	VotePost(userID, postID uuid.UUID, value int16) (*model.PostResponse, error)
	UpdatePostStatus(id uuid.UUID, status model.PostStatus) (*model.PostResponse, error)
	DeletePost(id uuid.UUID) error
}

type PostCommentRepository interface {
	Create(comment *model.PostComment) error
	FindByPostID(postID uuid.UUID, limit, offset int) ([]*model.PostComment, int64, error)
	FindByPostIDWithReplies(postID uuid.UUID) ([]*model.PostComment, error)
	FindByPostIDWithRepliesWithMeta(postID uuid.UUID, viewerID *uuid.UUID) ([]*model.PostComment, error)
	FindByID(id uuid.UUID) (*model.PostComment, error)
	FindByIDWithMeta(id uuid.UUID, viewerID *uuid.UUID) (*model.PostComment, error)
	Vote(commentID, userID uuid.UUID, value int16) error
	Update(comment *model.PostComment) error
	Delete(id uuid.UUID) error
}

type PostCommentService interface {
	CreateComment(userID, postID uuid.UUID, req *model.CreatePostCommentRequest) (*model.PostCommentResponse, error)
	GetCommentsByPostID(postID uuid.UUID, limit, offset int) ([]*model.PostCommentResponse, int64, error)
	GetCommentsByPostIDWithReplies(postID uuid.UUID, viewerID uuid.UUID) ([]*model.PostCommentResponse, error)
	UpdateComment(id, userID uuid.UUID, content string) (*model.PostCommentResponse, error)
	DeleteComment(id, userID uuid.UUID) error
	VoteComment(userID, commentID uuid.UUID, value int16) (*model.PostCommentResponse, error)
}
