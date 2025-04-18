package controller

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/types"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockAuthService는 AuthService 인터페이스의 mock 구현체입니다
type MockAuthService struct {
	mock.Mock
}

func (m *MockAuthService) Register(req *model.RegisterRequest) (*model.UserResponse, error) {
	args := m.Called(req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.UserResponse), args.Error(1)
}

func (m *MockAuthService) Login(req *model.LoginRequest) (*model.LoginResponse, error) {
	args := m.Called(req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.LoginResponse), args.Error(1)
}

func (m *MockAuthService) ValidateToken(tokenString string) (*types.JWTClaims, error) {
	args := m.Called(tokenString)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*types.JWTClaims), args.Error(1)
}

func (m *MockAuthService) GetUserByID(id uuid.UUID) (*model.UserResponse, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.UserResponse), args.Error(1)
}

func (m *MockAuthService) LoginWithGoogle(code string) (*model.LoginResponse, error) {
	args := m.Called(code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.LoginResponse), args.Error(1)
}

func (m *MockAuthService) LoginWithGitHub(code string) (*model.LoginResponse, error) {
	args := m.Called(code)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.LoginResponse), args.Error(1)
}

func setupTest(t *testing.T) (*gin.Engine, *MockAuthService, *AuthController) {
	// 기존 환경 변수 값 백업
	originalFrontendDomain := os.Getenv("FRONTEND_DOMAIN")

	// 테스트용 환경 변수 설정
	os.Setenv("FRONTEND_DOMAIN", "localhost")

	// 테스트 종료 후 정리를 위한 cleanup 등록
	t.Cleanup(func() {
		if originalFrontendDomain == "" {
			os.Unsetenv("FRONTEND_DOMAIN")
		} else {
			os.Setenv("FRONTEND_DOMAIN", originalFrontendDomain)
		}
	})

	gin.SetMode(gin.TestMode)
	r := gin.New()
	mockAuthService := new(MockAuthService)

	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log := zerolog.New(os.Stdout).With().Timestamp().Logger()
	testLogger := logger.NewZerologLogger(log)
	authController := NewAuthController(mockAuthService, testLogger)

	// 라우트 설정
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", authController.Register)
		auth.POST("/login", authController.Login)
		auth.GET("/me", authController.GetCurrentUser)
		auth.POST("/logout", authController.Logout)
		auth.GET("/google", authController.GoogleAuthHandler)
		auth.GET("/google/callback", authController.GoogleCallback)
		auth.GET("/github", authController.GitHubAuthHandler)
		auth.GET("/github/callback", authController.GitHubCallback)
	}

	return r, mockAuthService, authController
}

func TestRegister(t *testing.T) {
	r, mockService, _ := setupTest(t)

	t.Run("successful registration", func(t *testing.T) {
		registerReq := &model.RegisterRequest{
			Email:    "test@example.com",
			Password: "password123",
			Name:     "Test User",
		}

		expectedResponse := &model.UserResponse{
			ID:    uuid.New(),
			Email: registerReq.Email,
			Name:  registerReq.Name,
		}

		mockService.On("Register", registerReq).Return(expectedResponse, nil).Once()

		body, _ := json.Marshal(registerReq)
		req := httptest.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)

		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.True(t, response["success"].(bool))
		assert.NotNil(t, response["user"])
	})

	t.Run("invalid request", func(t *testing.T) {
		invalidReq := map[string]interface{}{
			"email": "invalid-email",
		}

		body, _ := json.Marshal(invalidReq)
		req := httptest.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestLogin(t *testing.T) {
	r, mockService, _ := setupTest(t)

	t.Run("successful login", func(t *testing.T) {
		loginReq := &model.LoginRequest{
			Email:    "test@example.com",
			Password: "password123",
		}

		expectedResponse := &model.LoginResponse{
			User: &model.UserResponse{
				ID:    uuid.New(),
				Email: loginReq.Email,
				Name:  "Test User",
			},
			AccessToken: "test-token",
		}

		mockService.On("Login", loginReq).Return(expectedResponse, nil).Once()

		body, _ := json.Marshal(loginReq)
		req := httptest.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.True(t, response["success"].(bool))
		assert.NotNil(t, response["user"])

		// 쿠키 검증
		cookies := w.Result().Cookies()
		var authCookie *http.Cookie
		for _, cookie := range cookies {
			if cookie.Name == "authToken" {
				authCookie = cookie
				break
			}
		}
		assert.NotNil(t, authCookie)
		assert.Equal(t, expectedResponse.AccessToken, authCookie.Value)
	})

	t.Run("invalid credentials", func(t *testing.T) {
		loginReq := &model.LoginRequest{
			Email:    "test@example.com",
			Password: "wrongpassword",
		}

		mockService.On("Login", loginReq).Return(nil, errors.New("invalid credentials")).Once()

		body, _ := json.Marshal(loginReq)
		req := httptest.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	// 테스트 종료 후 환경 변수 정리
	t.Cleanup(func() {
		os.Unsetenv("FRONTEND_DOMAIN")
	})
}

// test currentUser
func TestGetCurrentUser(t *testing.T) {
	t.Run("successful_get_current_user", func(t *testing.T) {
		// gin 라우터 직접 설정
		gin.SetMode(gin.TestMode)
		r := gin.New()
		mockService := new(MockAuthService)

		zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
		log := zerolog.New(os.Stdout).With().Timestamp().Logger()
		testLogger := logger.NewZerologLogger(log)
		authController := NewAuthController(mockService, testLogger)

		userID := uuid.New()
		expectedUser := &model.UserResponse{
			ID:    userID,
			Email: "test@example.com",
			Name:  "Test User",
		}

		mockService.On("GetUserByID", userID).Return(expectedUser, nil)

		// 테스트용 미들웨어와 핸들러 설정
		r.GET("/api/auth/me", func(c *gin.Context) {
			c.Set("userID", userID)
			c.Next()
		}, authController.GetCurrentUser)

		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/api/auth/me", nil)

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.True(t, response["success"].(bool))
		assert.NotNil(t, response["user"])

		mockService.AssertExpectations(t)
	})

	t.Run("unauthorized_user", func(t *testing.T) {
		r, _, _ := setupTest(t)

		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/api/auth/me", nil)

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)

		assert.False(t, response["success"].(bool))
		assert.Equal(t, "Unauthorized", response["message"])
	})
}

func TestLogout(t *testing.T) {
	r, _, _ := setupTest(t)

	req := httptest.NewRequest("POST", "/api/auth/logout", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// 쿠키가 제거되었는지 확인
	cookies := w.Result().Cookies()
	var authCookie *http.Cookie
	for _, cookie := range cookies {
		if cookie.Name == "authToken" {
			authCookie = cookie
			break
		}
	}
	assert.NotNil(t, authCookie)
	assert.Equal(t, "", authCookie.Value)
	assert.Equal(t, -1, authCookie.MaxAge)
}

func TestGoogleAuth(t *testing.T) {
	r, mockService, _ := setupTest(t)

	t.Run("google callback success", func(t *testing.T) {
		// Set required environment variables for the test
		os.Setenv("FRONTEND_URL", "http://localhost:3000")
		os.Setenv("FRONTEND_DOMAIN", "localhost")

		code := "test-auth-code"
		expectedResponse := &model.LoginResponse{
			User: &model.UserResponse{
				ID:    uuid.New(),
				Email: "test@gmail.com",
				Name:  "Google User",
			},
			AccessToken: "google-test-token",
		}

		// Mock service's LoginWithGoogle call
		mockService.On("LoginWithGoogle", code).Return(expectedResponse, nil).Once()

		// Create test request
		req := httptest.NewRequest("GET", "/api/auth/google/callback?code="+code, nil)
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		// Verify response
		assert.Equal(t, http.StatusTemporaryRedirect, w.Code)
		location := w.Header().Get("Location")
		assert.Contains(t, location, "localhost")

		mockService.AssertExpectations(t)

		// Clean up environment variables
		os.Unsetenv("FRONTEND_URL")
		os.Unsetenv("FRONTEND_DOMAIN")
	})

	t.Run("google callback error", func(t *testing.T) {
		code := "invalid-code"
		mockService.On("LoginWithGoogle", code).Return(nil, errors.New("authentication failed")).Once()

		req := httptest.NewRequest("GET", "/api/auth/google/callback?code="+code, nil)
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
		mockService.AssertExpectations(t)
	})
}

// TestGitHubAuth에서만 사용할 테스트용 설정을 위한 헬퍼 함수
func setupTestWithEnv(t *testing.T) (*gin.Engine, *MockAuthService, *AuthController, func()) {
	// 기존 환경변수 백업
	originalEnv := map[string]string{
		"FRONTEND_DOMAIN": os.Getenv("FRONTEND_DOMAIN"),
		"FRONTEND_URL":    os.Getenv("FRONTEND_URL"),
	}

	// 테스트용 환경변수 설정
	testEnv := map[string]string{
		"FRONTEND_DOMAIN": "localhost",
		"FRONTEND_URL":    "http://localhost:3000",
	}

	// 환경변수가 설정되어 있지 않은 경우에만 테스트용 값 설정
	for key, value := range testEnv {
		if os.Getenv(key) == "" {
			os.Setenv(key, value)
		}
	}

	r, mockService, controller := setupTest(t)

	// cleanup 함수 반환
	cleanup := func() {
		// 원래 값으로 복원
		for key, value := range originalEnv {
			if value == "" {
				os.Unsetenv(key)
			} else {
				os.Setenv(key, value)
			}
		}
	}

	// cleanup 함수를 테스트 종료 시 실행되도록 등록
	t.Cleanup(cleanup)

	return r, mockService, controller, cleanup
}

func TestGitHubAuth(t *testing.T) {
	r, mockService, _, _ := setupTestWithEnv(t)

	t.Run("github callback success", func(t *testing.T) {
		code := "test-auth-code"
		expectedResponse := &model.LoginResponse{
			User: &model.UserResponse{
				ID:    uuid.New(),
				Email: "test@github.com",
				Name:  "GitHub User",
			},
			AccessToken: "github-test-token",
		}

		mockService.On("LoginWithGitHub", code).Return(expectedResponse, nil).Once()

		req := httptest.NewRequest("GET", "/api/auth/github/callback?code="+code, nil)
		w := httptest.NewRecorder()

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusTemporaryRedirect, w.Code)
		assert.Contains(t, w.Header().Get("Location"), "/dashboard")

		mockService.AssertExpectations(t)
	})
}
