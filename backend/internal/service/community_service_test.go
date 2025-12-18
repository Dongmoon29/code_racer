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

type MockCommunityRepository struct {
	mock.Mock
}

func (m *MockCommunityRepository) Create(post *model.Post) error {
	args := m.Called(post)
	return args.Error(0)
}

func (m *MockCommunityRepository) FindByID(id uuid.UUID) (*model.Post, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Post), args.Error(1)
}

func (m *MockCommunityRepository) FindByIDWithMeta(id uuid.UUID, viewerID *uuid.UUID) (*model.Post, error) {
	args := m.Called(id, viewerID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Post), args.Error(1)
}

func (m *MockCommunityRepository) FindByUserID(userID uuid.UUID, limit, offset int) ([]*model.Post, int64, error) {
	args := m.Called(userID, limit, offset)
	return args.Get(0).([]*model.Post), args.Get(1).(int64), args.Error(2)
}

func (m *MockCommunityRepository) ListAllWithMeta(limit, offset int, status *model.PostStatus, postType *model.PostType, sort model.PostSort, viewerID *uuid.UUID) ([]*model.Post, int64, error) {
	args := m.Called(limit, offset, status, postType, sort, viewerID)
	return args.Get(0).([]*model.Post), args.Get(1).(int64), args.Error(2)
}

func (m *MockCommunityRepository) Vote(postID, userID uuid.UUID, value int16) error {
	args := m.Called(postID, userID, value)
	return args.Error(0)
}

func (m *MockCommunityRepository) Update(post *model.Post) error {
	args := m.Called(post)
	return args.Error(0)
}

func (m *MockCommunityRepository) Delete(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func TestCommunityService_VotePost_InvalidValue_ReturnsError(t *testing.T) {
	logger := testutil.SetupTestLogger()
	repo := new(MockCommunityRepository)
	svc := NewCommunityService(repo, logger)

	_, err := svc.VotePost(uuid.New(), uuid.New(), 2)
	assert.Error(t, err)
}

func TestCommunityService_VotePost_PostNotFound_ReturnsNotFound(t *testing.T) {
	logger := testutil.SetupTestLogger()
	repo := new(MockCommunityRepository)
	svc := NewCommunityService(repo, logger)

	userID := uuid.New()
	postID := uuid.New()

	repo.On("FindByID", postID).Return(nil, gorm.ErrRecordNotFound).Once()

	_, err := svc.VotePost(userID, postID, 1)
	assert.Error(t, err)
	repo.AssertExpectations(t)
}

func TestCommunityService_VotePost_Success_ReturnsUpdatedPost(t *testing.T) {
	logger := testutil.SetupTestLogger()
	repo := new(MockCommunityRepository)
	svc := NewCommunityService(repo, logger)

	userID := uuid.New()
	postID := uuid.New()

	repo.On("FindByID", postID).Return(&model.Post{ID: postID}, nil).Once()
	repo.On("Vote", postID, userID, int16(1)).Return(nil).Once()
	repo.On("FindByIDWithMeta", postID, &userID).Return(&model.Post{
		ID:           postID,
		UserID:       userID,
		Title:        "t",
		Content:      "c",
		Type:         model.PostTypeOther,
		Status:       model.PostStatusPending,
		Score:        7,
		CommentCount: 3,
		MyVote:       1,
	}, nil).Once()

	resp, err := svc.VotePost(userID, postID, 1)
	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, int64(7), resp.Score)
	assert.Equal(t, int64(3), resp.CommentCount)
	assert.Equal(t, int16(1), resp.MyVote)
	repo.AssertExpectations(t)
}
