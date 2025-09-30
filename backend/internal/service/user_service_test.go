package service

import (
	"errors"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserRepository는 테스트를 위한 UserRepository 모의 객체
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) Create(user *model.User) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) FindByID(id uuid.UUID) (*model.User, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *MockUserRepository) FindByEmail(email string) (*model.User, error) {
	args := m.Called(email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *MockUserRepository) Update(user *model.User) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) ListUsers(offset int, limit int, orderByField string, orderDir string) ([]*model.User, int64, error) {
	args := m.Called(offset, limit, orderByField, orderDir)
	return args.Get(0).([]*model.User), args.Get(1).(int64), args.Error(2)
}

// setupUserServiceTest는 테스트를 위한 UserService 설정
func setupUserServiceTest() (*MockUserRepository, UserService) {
	mockRepo := &MockUserRepository{}
	testLogger := logger.NewZerologLogger(zerolog.New(zerolog.NewConsoleWriter()).With().Caller().Logger())
	service := NewUserService(mockRepo, testLogger)

	return mockRepo, service
}

func TestUserService_GetUserByID_ValidID_ReturnsUserResponse(t *testing.T) {
	// Given
	mockRepo, service := setupUserServiceTest()
	userID := uuid.New()

	expectedUser := &model.User{
		ID:    userID,
		Email: "test@example.com",
		Name:  "Test User",
	}

	mockRepo.On("FindByID", userID).Return(expectedUser, nil)

	// When
	result, err := service.GetUserByID(userID)

	// Then
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, expectedUser.Email, result.Email)
	assert.Equal(t, expectedUser.Name, result.Name)
	mockRepo.AssertExpectations(t)
}

func TestUserService_GetUserByID_UserNotFound_ReturnsError(t *testing.T) {
	// Given
	mockRepo, service := setupUserServiceTest()
	userID := uuid.New()

	mockRepo.On("FindByID", userID).Return(nil, errors.New("user not found"))

	// When
	result, err := service.GetUserByID(userID)

	// Then
	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "failed to find user")
	mockRepo.AssertExpectations(t)
}

func TestUserService_GetProfile_ValidID_ReturnsUserProfile(t *testing.T) {
	// Given
	mockRepo, service := setupUserServiceTest()
	userID := uuid.New()

	expectedUser := &model.User{
		ID:          userID,
		Email:       "test@example.com",
		Name:        "Test User",
		Homepage:    "https://example.com",
		LinkedIn:    "https://linkedin.com/in/test",
		GitHub:      "https://github.com/test",
		Company:     "Test Company",
		JobTitle:    "Software Engineer",
		FavLanguage: "Go",
	}

	mockRepo.On("FindByID", userID).Return(expectedUser, nil)

	// When
	result, err := service.GetProfile(userID)

	// Then
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, expectedUser.Homepage, result.Homepage)
	assert.Equal(t, expectedUser.LinkedIn, result.LinkedIn)
	assert.Equal(t, expectedUser.GitHub, result.GitHub)
	assert.Equal(t, expectedUser.Company, result.Company)
	assert.Equal(t, expectedUser.JobTitle, result.JobTitle)
	assert.Equal(t, expectedUser.FavLanguage, result.FavLanguage)
	mockRepo.AssertExpectations(t)
}

func TestUserService_UpdateProfile_ValidRequest_UpdatesUserProfile(t *testing.T) {
	// Given
	mockRepo, service := setupUserServiceTest()
	userID := uuid.New()

	existingUser := &model.User{
		ID:          userID,
		Email:       "test@example.com",
		Name:        "Test User",
		Homepage:    "https://old.com",
		LinkedIn:    "https://linkedin.com/in/old",
		GitHub:      "https://github.com/old",
		Company:     "Old Company",
		JobTitle:    "Old Title",
		FavLanguage: "Python",
	}

	updateReq := &model.UpdateProfileRequest{
		Homepage:    "https://new.com",
		LinkedIn:    "https://linkedin.com/in/new",
		GitHub:      "https://github.com/new",
		Company:     "New Company",
		JobTitle:    "New Title",
		FavLanguage: "Go",
	}

	mockRepo.On("FindByID", userID).Return(existingUser, nil)
	mockRepo.On("Update", mock.AnythingOfType("*model.User")).Return(nil)

	// When
	result, err := service.UpdateProfile(userID, updateReq)

	// Then
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, updateReq.Homepage, result.Homepage)
	assert.Equal(t, updateReq.LinkedIn, result.LinkedIn)
	assert.Equal(t, updateReq.GitHub, result.GitHub)
	assert.Equal(t, updateReq.Company, result.Company)
	assert.Equal(t, updateReq.JobTitle, result.JobTitle)
	assert.Equal(t, updateReq.FavLanguage, result.FavLanguage)
	mockRepo.AssertExpectations(t)
}

func TestUserService_UpdateProfile_UserNotFound_ReturnsError(t *testing.T) {
	// Given
	mockRepo, service := setupUserServiceTest()
	userID := uuid.New()

	updateReq := &model.UpdateProfileRequest{
		Homepage: "https://new.com",
	}

	mockRepo.On("FindByID", userID).Return(nil, errors.New("user not found"))

	// When
	result, err := service.UpdateProfile(userID, updateReq)

	// Then
	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "failed to find user")
	mockRepo.AssertExpectations(t)
}

func TestUserService_ListUsers_ValidParameters_ReturnsUsersList(t *testing.T) {
	// Given
	mockRepo, service := setupUserServiceTest()

	expectedUsers := []*model.User{
		{ID: uuid.New(), Email: "user1@example.com", Name: "User 1"},
		{ID: uuid.New(), Email: "user2@example.com", Name: "User 2"},
	}
	expectedTotal := int64(2)

	mockRepo.On("ListUsers", 0, 20, "created_at", "desc").Return(expectedUsers, expectedTotal, nil)

	// When
	result, total, err := service.ListUsers(1, 20, "created_at", "desc")

	// Then
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, expectedUsers, result)
	assert.Equal(t, expectedTotal, total)
	mockRepo.AssertExpectations(t)
}

func TestUserService_ListUsers_DefaultParameters_UsesDefaults(t *testing.T) {
	// Given
	mockRepo, service := setupUserServiceTest()

	expectedUsers := []*model.User{
		{ID: uuid.New(), Email: "user1@example.com", Name: "User 1"},
	}
	expectedTotal := int64(1)

	mockRepo.On("ListUsers", 0, 20, "created_at", "desc").Return(expectedUsers, expectedTotal, nil)

	// When
	result, total, err := service.ListUsers(0, 0, "", "")

	// Then
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, expectedUsers, result)
	assert.Equal(t, expectedTotal, total)
	mockRepo.AssertExpectations(t)
}

func TestUserService_ListUsers_RepositoryError_ReturnsError(t *testing.T) {
	// Given
	mockRepo, service := setupUserServiceTest()

	mockRepo.On("ListUsers", 0, 20, "created_at", "desc").Return([]*model.User(nil), int64(0), errors.New("database error"))

	// When
	result, total, err := service.ListUsers(1, 20, "created_at", "desc")

	// Then
	assert.Error(t, err)
	assert.Nil(t, result)
	assert.Equal(t, int64(0), total)
	assert.Contains(t, err.Error(), "failed to list users")
	mockRepo.AssertExpectations(t)
}

// 테이블 드리븐 테스트 예시
func TestUserService_ListUsers_PaginationParameters(t *testing.T) {
	tests := []struct {
		name           string
		page           int
		limit          int
		expectedOffset int
		expectedLimit  int
	}{
		{
			name:           "first page with limit 10",
			page:           1,
			limit:          10,
			expectedOffset: 0,
			expectedLimit:  10,
		},
		{
			name:           "second page with limit 5",
			page:           2,
			limit:          5,
			expectedOffset: 5,
			expectedLimit:  5,
		},
		{
			name:           "zero page defaults to 1",
			page:           0,
			limit:          20,
			expectedOffset: 0,
			expectedLimit:  20,
		},
		{
			name:           "negative limit defaults to 20",
			page:           1,
			limit:          -5,
			expectedOffset: 0,
			expectedLimit:  20,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			mockRepo, service := setupUserServiceTest()

			expectedUsers := []*model.User{}
			expectedTotal := int64(0)

			mockRepo.On("ListUsers", tt.expectedOffset, tt.expectedLimit, "created_at", "desc").Return(expectedUsers, expectedTotal, nil)

			// When
			result, total, err := service.ListUsers(tt.page, tt.limit, "", "")

			// Then
			assert.NoError(t, err)
			assert.NotNil(t, result)
			assert.Equal(t, expectedUsers, result)
			assert.Equal(t, expectedTotal, total)
			mockRepo.AssertExpectations(t)
		})
	}
}
