package controller

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockUserService는 테스트를 위한 UserService 모의 객체
type MockUserService struct {
	mock.Mock
}

func (m *MockUserService) GetUserByID(userID uuid.UUID) (*model.UserResponse, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.UserResponse), args.Error(1)
}

func (m *MockUserService) GetProfile(userID uuid.UUID) (*model.User, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *MockUserService) UpdateProfile(userID uuid.UUID, req *model.UpdateProfileRequest) (*model.User, error) {
	args := m.Called(userID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *MockUserService) ListUsers(page int, limit int, orderBy string, dir string) ([]*model.User, int64, error) {
	args := m.Called(page, limit, orderBy, dir)
	return args.Get(0).([]*model.User), args.Get(1).(int64), args.Error(2)
}

// setupUserControllerTest는 테스트를 위한 UserController 설정
func setupUserControllerTest() (*gin.Engine, *MockUserService, *UserController) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	mockService := &MockUserService{}
	testLogger := logger.NewZerologLogger(zerolog.New(zerolog.NewConsoleWriter()).With().Caller().Logger())
	controller := NewUserController(mockService, testLogger)

	return router, mockService, controller
}

func TestUserController_GetCurrentUser_ValidToken_ReturnsUser(t *testing.T) {
	// Given
	router, mockService, controller := setupUserControllerTest()
	userID := uuid.New()

	expectedUser := &model.UserResponse{
		ID:    userID,
		Email: "test@example.com",
		Name:  "Test User",
	}

	mockService.On("GetUserByID", userID).Return(expectedUser, nil)

	// Mock JWT middleware to set user ID in context
	router.GET("/api/user/me", func(c *gin.Context) {
		c.Set("userID", userID)
		controller.GetCurrentUser(c)
	})

	// When
	req, _ := http.NewRequest("GET", "/api/user/me", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Then
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	user := response["user"].(map[string]interface{})
	assert.Equal(t, expectedUser.Email, user["email"])
	assert.Equal(t, expectedUser.Name, user["name"])

	mockService.AssertExpectations(t)
}

func TestUserController_GetCurrentUser_UserNotFound_ReturnsError(t *testing.T) {
	// Given
	router, mockService, controller := setupUserControllerTest()
	userID := uuid.New()

	mockService.On("GetUserByID", userID).Return(nil, errors.New("user not found"))

	// Mock JWT middleware to set user ID in context
	router.GET("/api/user/me", func(c *gin.Context) {
		c.Set("userID", userID)
		controller.GetCurrentUser(c)
	})

	// When
	req, _ := http.NewRequest("GET", "/api/user/me", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Then
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Contains(t, response["message"], "user not found")

	mockService.AssertExpectations(t)
}

func TestUserController_GetProfile_ValidRequest_ReturnsProfile(t *testing.T) {
	// Given
	router, mockService, controller := setupUserControllerTest()
	userID := uuid.New()

	expectedProfile := &model.User{
		Homepage:    "https://example.com",
		LinkedIn:    "https://linkedin.com/in/test",
		GitHub:      "https://github.com/test",
		Company:     "Test Company",
		JobTitle:    "Software Engineer",
		FavLanguage: "go",
	}

	mockService.On("GetProfile", userID).Return(expectedProfile, nil)

	// Mock JWT middleware to set user ID in context
	router.GET("/api/user/profile/:userId", func(c *gin.Context) {
		c.Params = gin.Params{gin.Param{Key: "userId", Value: userID.String()}}
		controller.GetProfile(c)
	})

	// When
	req, _ := http.NewRequest("GET", "/api/user/profile/"+userID.String(), nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Then
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	profile := response["profile"].(map[string]interface{})
	assert.Equal(t, expectedProfile.Homepage, profile["homepage"])
	assert.Equal(t, expectedProfile.LinkedIn, profile["linkedin"])
	assert.Equal(t, expectedProfile.GitHub, profile["github"])
	assert.Equal(t, expectedProfile.Company, profile["company"])
	assert.Equal(t, expectedProfile.JobTitle, profile["job_title"])
	assert.Equal(t, expectedProfile.FavLanguage, profile["fav_language"])

	mockService.AssertExpectations(t)
}

func TestUserController_UpdateProfile_ValidRequest_UpdatesProfile(t *testing.T) {
	// Given
	router, mockService, controller := setupUserControllerTest()
	userID := uuid.New()

	updateReq := &model.UpdateProfileRequest{
		Homepage:    "https://new.com",
		LinkedIn:    "https://linkedin.com/in/new",
		GitHub:      "https://github.com/new",
		Company:     "New Company",
		JobTitle:    "New Title",
		FavLanguage: "go",
	}

	updatedProfile := &model.User{
		Homepage:    updateReq.Homepage,
		LinkedIn:    updateReq.LinkedIn,
		GitHub:      updateReq.GitHub,
		Company:     updateReq.Company,
		JobTitle:    updateReq.JobTitle,
		FavLanguage: updateReq.FavLanguage,
	}

	mockService.On("UpdateProfile", userID, updateReq).Return(updatedProfile, nil)

	// Mock JWT middleware to set user ID in context
	router.PUT("/api/user/profile", func(c *gin.Context) {
		c.Set("userID", userID)
		controller.UpdateProfile(c)
	})

	// When
	body, _ := json.Marshal(updateReq)
	req, _ := http.NewRequest("PUT", "/api/user/profile", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Then
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	profile := response["profile"].(map[string]interface{})
	assert.Equal(t, updateReq.Homepage, profile["homepage"])
	assert.Equal(t, updateReq.LinkedIn, profile["linkedin"])
	assert.Equal(t, updateReq.GitHub, profile["github"])
	assert.Equal(t, updateReq.Company, profile["company"])
	assert.Equal(t, updateReq.JobTitle, profile["job_title"])
	assert.Equal(t, updateReq.FavLanguage, profile["fav_language"])

	mockService.AssertExpectations(t)
}

func TestUserController_UpdateProfile_InvalidJSON_ReturnsError(t *testing.T) {
	// Given
	router, mockService, controller := setupUserControllerTest()
	userID := uuid.New()

	// Mock JWT middleware to set user ID in context
	router.PUT("/api/user/profile", func(c *gin.Context) {
		c.Set("userID", userID)
		controller.UpdateProfile(c)
	})

	// When
	req, _ := http.NewRequest("PUT", "/api/user/profile", bytes.NewBuffer([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Then
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Contains(t, response["message"], "Invalid request")

	mockService.AssertExpectations(t)
}

func TestUserController_UpdateProfile_ServiceError_ReturnsError(t *testing.T) {
	// Given
	router, mockService, controller := setupUserControllerTest()
	userID := uuid.New()

	updateReq := &model.UpdateProfileRequest{
		Homepage: "https://new.com",
	}

	mockService.On("UpdateProfile", userID, updateReq).Return(nil, errors.New("update failed"))

	// Mock JWT middleware to set user ID in context
	router.PUT("/api/user/profile", func(c *gin.Context) {
		c.Set("userID", userID)
		controller.UpdateProfile(c)
	})

	// When
	body, _ := json.Marshal(updateReq)
	req, _ := http.NewRequest("PUT", "/api/user/profile", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Then
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Contains(t, response["message"], "update failed")

	mockService.AssertExpectations(t)
}

func TestUserController_AdminListUsers_ValidRequest_ReturnsUsersList(t *testing.T) {
	// Given
	router, mockService, controller := setupUserControllerTest()

	expectedUsers := []*model.User{
		{ID: uuid.New(), Email: "user1@example.com", Name: "User 1"},
		{ID: uuid.New(), Email: "user2@example.com", Name: "User 2"},
	}
	expectedTotal := int64(2)

	mockService.On("ListUsers", 1, 20, "created_at", "desc").Return(expectedUsers, expectedTotal, nil)

	// When
	req, _ := http.NewRequest("GET", "/api/admin/users?page=1&limit=20&sort=created_at:desc", nil)
	w := httptest.NewRecorder()
	router.GET("/api/admin/users", controller.AdminListUsers)
	router.ServeHTTP(w, req)

	// Then
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	items := response["items"].([]interface{})
	assert.Len(t, items, 2)
	assert.Equal(t, float64(2), response["total"])

	mockService.AssertExpectations(t)
}

func TestUserController_AdminListUsers_DefaultParameters_UsesDefaults(t *testing.T) {
	// Given
	router, mockService, controller := setupUserControllerTest()

	expectedUsers := []*model.User{
		{ID: uuid.New(), Email: "user1@example.com", Name: "User 1"},
	}
	expectedTotal := int64(1)

	mockService.On("ListUsers", 1, 20, "created_at", "desc").Return(expectedUsers, expectedTotal, nil)

	// When
	req, _ := http.NewRequest("GET", "/api/admin/users", nil)
	w := httptest.NewRecorder()
	router.GET("/api/admin/users", controller.AdminListUsers)
	router.ServeHTTP(w, req)

	// Then
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))

	mockService.AssertExpectations(t)
}

func TestUserController_AdminListUsers_ServiceError_ReturnsError(t *testing.T) {
	// Given
	router, mockService, controller := setupUserControllerTest()

	mockService.On("ListUsers", 1, 20, "created_at", "desc").Return([]*model.User(nil), int64(0), errors.New("database error"))

	// When
	req, _ := http.NewRequest("GET", "/api/admin/users", nil)
	w := httptest.NewRecorder()
	router.GET("/api/admin/users", controller.AdminListUsers)
	router.ServeHTTP(w, req)

	// Then
	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Contains(t, response["message"], "database error")

	mockService.AssertExpectations(t)
}
