package service

import (
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/testutil"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

type MockPostCommentRepository struct {
	mock.Mock
}

func (m *MockPostCommentRepository) Create(comment *model.PostComment) error {
	args := m.Called(comment)
	return args.Error(0)
}

func (m *MockPostCommentRepository) FindByPostID(postID uuid.UUID, limit, offset int) ([]*model.PostComment, int64, error) {
	args := m.Called(postID, limit, offset)
	return args.Get(0).([]*model.PostComment), args.Get(1).(int64), args.Error(2)
}

func (m *MockPostCommentRepository) FindByPostIDWithReplies(postID uuid.UUID) ([]*model.PostComment, error) {
	args := m.Called(postID)
	return args.Get(0).([]*model.PostComment), args.Error(1)
}

func (m *MockPostCommentRepository) FindByPostIDWithRepliesWithMeta(postID uuid.UUID, viewerID *uuid.UUID) ([]*model.PostComment, error) {
	args := m.Called(postID, viewerID)
	return args.Get(0).([]*model.PostComment), args.Error(1)
}

func (m *MockPostCommentRepository) FindByID(id uuid.UUID) (*model.PostComment, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.PostComment), args.Error(1)
}

func (m *MockPostCommentRepository) FindByIDWithMeta(id uuid.UUID, viewerID *uuid.UUID) (*model.PostComment, error) {
	args := m.Called(id, viewerID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.PostComment), args.Error(1)
}

func (m *MockPostCommentRepository) Vote(commentID, userID uuid.UUID, value int16) error {
	args := m.Called(commentID, userID, value)
	return args.Error(0)
}

func (m *MockPostCommentRepository) Update(comment *model.PostComment) error {
	args := m.Called(comment)
	return args.Error(0)
}

func (m *MockPostCommentRepository) Delete(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func TestPostCommentService_VoteComment_InvalidValue_ReturnsError(t *testing.T) {
	logger := testutil.SetupTestLogger()
	repo := new(MockPostCommentRepository)
	svc := NewPostCommentService(repo, logger)

	_, err := svc.VoteComment(uuid.New(), uuid.New(), 2)
	assert.Error(t, err)
}

func TestPostCommentService_VoteComment_CommentNotFound_ReturnsNotFound(t *testing.T) {
	logger := testutil.SetupTestLogger()
	repo := new(MockPostCommentRepository)
	svc := NewPostCommentService(repo, logger)

	userID := uuid.New()
	commentID := uuid.New()

	repo.On("FindByID", commentID).Return(nil, gorm.ErrRecordNotFound).Once()

	_, err := svc.VoteComment(userID, commentID, 1)
	assert.Error(t, err)
	repo.AssertExpectations(t)
}

func TestPostCommentService_VoteComment_Success_ReturnsUpdatedComment(t *testing.T) {
	logger := testutil.SetupTestLogger()
	repo := new(MockPostCommentRepository)
	svc := NewPostCommentService(repo, logger)

	userID := uuid.New()
	postID := uuid.New()
	commentID := uuid.New()

	repo.On("FindByID", commentID).Return(&model.PostComment{ID: commentID, PostID: postID, UserID: userID}, nil).Once()
	repo.On("Vote", commentID, userID, int16(-1)).Return(nil).Once()
	repo.On("FindByIDWithMeta", commentID, &userID).Return(&model.PostComment{
		ID:      commentID,
		PostID:  postID,
		UserID:  userID,
		Score:   -3,
		MyVote:  -1,
		Content: "x",
	}, nil).Once()

	resp, err := svc.VoteComment(userID, commentID, -1)
	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, int64(-3), resp.Score)
	assert.Equal(t, int16(-1), resp.MyVote)
	repo.AssertExpectations(t)
}
