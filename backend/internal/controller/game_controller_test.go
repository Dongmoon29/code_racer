package controller

import (
	"bytes"
	"encoding/json"
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

// MockGameService는 테스트를 위한 GameService 모의 객체입니다
type MockGameService struct {
	mock.Mock
}

func (m *MockGameService) CreateGame(userID uuid.UUID, req *model.CreateGameRequest) (*model.GameResponse, error) {
	args := m.Called(userID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.GameResponse), args.Error(1)
}

func (m *MockGameService) GetGame(gameID uuid.UUID) (*model.GameResponse, error) {
	args := m.Called(gameID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.GameResponse), args.Error(1)
}

func (m *MockGameService) ListGames() ([]*model.GameListResponse, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*model.GameListResponse), args.Error(1)
}

func (m *MockGameService) ListLeetCodes() ([]*model.LeetCodeSummary, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*model.LeetCodeSummary), args.Error(1)
}

func (m *MockGameService) JoinGame(gameID uuid.UUID, userID uuid.UUID) (*model.GameResponse, error) {
	args := m.Called(gameID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.GameResponse), args.Error(1)
}

func (m *MockGameService) SubmitSolution(gameID uuid.UUID, userID uuid.UUID, req *model.SubmitSolutionRequest) (*model.SubmitSolutionResponse, error) {
	args := m.Called(gameID, userID, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.SubmitSolutionResponse), args.Error(1)
}

func (m *MockGameService) UpdateCode(gameID uuid.UUID, userID uuid.UUID, code string) error {
	args := m.Called(gameID, userID, code)
	return args.Error(0)
}

func (m *MockGameService) GetPlayerCode(gameID uuid.UUID, userID uuid.UUID) (string, error) {
	args := m.Called(gameID, userID)
	return args.String(0), args.Error(1)
}

func (m *MockGameService) CloseGame(gameID uuid.UUID, userID uuid.UUID) error {
	args := m.Called(gameID, userID)
	return args.Error(0)
}

func (m *MockGameService) CreateLeetCode(req *model.CreateLeetCodeRequest) (*model.LeetCodeDetail, error) {
	args := m.Called(req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.LeetCodeDetail), args.Error(1)
}

func (m *MockGameService) UpdateLeetCode(id uuid.UUID, req *model.UpdateLeetCodeRequest) (*model.LeetCodeDetail, error) {
	args := m.Called(id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.LeetCodeDetail), args.Error(1)
}

func (m *MockGameService) DeleteLeetCode(id uuid.UUID) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockGameService) GetLeetCode(id uuid.UUID) (*model.LeetCodeDetail, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.LeetCodeDetail), args.Error(1)
}

func setupGameTest() (*gin.Engine, *MockGameService, *GameController) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	mockService := new(MockGameService)
	log := zerolog.New(zerolog.NewTestWriter(nil)).With().Timestamp().Logger()
	testLogger := logger.NewZerologLogger(log)
	gameController := NewGameController(mockService, testLogger)

	// 먼저 미들웨어를 설정
	r.Use(func(c *gin.Context) {
		// 기본적으로 인증된 상태로 설정
		c.Set("userID", uuid.New())
		c.Next()
	})

	games := r.Group("/api/games")
	{
		games.POST("", gameController.CreateGame)
		games.GET("", gameController.ListGames)
		games.GET("/:id", gameController.GetGame)
		games.POST("/:id/join", gameController.JoinGame)
		games.POST("/:id/submit", gameController.SubmitSolution)
		games.POST("/:id/close", gameController.CloseGame)
	}

	return r, mockService, gameController
}

func TestCreateGame(t *testing.T) {
	t.Run("successful_create_game", func(t *testing.T) {
		r, mockService, _ := setupGameTest()

		userID := uuid.New()
		leetCodeID := uuid.New()
		req := &model.CreateGameRequest{
			LeetCodeID: leetCodeID,
		}

		expectedGame := &model.GameResponse{
			ID: uuid.New(),
			Creator: &model.UserResponse{
				ID: userID,
			},
			Status: model.GameStatusWaiting,
		}

		mockService.On("CreateGame", mock.AnythingOfType("uuid.UUID"), req).Return(expectedGame, nil)

		reqBody, _ := json.Marshal(req)
		w := httptest.NewRecorder()
		request := httptest.NewRequest("POST", "/api/games", bytes.NewBuffer(reqBody))
		request.Header.Set("Content-Type", "application/json")

		r.ServeHTTP(w, request)

		assert.Equal(t, http.StatusCreated, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response["success"].(bool))
		assert.NotNil(t, response["game"])

		mockService.AssertExpectations(t)
	})

	t.Run("unauthorized_create_game", func(t *testing.T) {
		// 인증되지 않은 요청을 테스트하기 위해 새로운 라우터 설정
		gin.SetMode(gin.TestMode)
		r := gin.New()
		mockService := new(MockGameService)
		log := zerolog.New(zerolog.NewTestWriter(nil)).With().Timestamp().Logger()
		testLogger := logger.NewZerologLogger(log)
		gameController := NewGameController(mockService, testLogger)

		games := r.Group("/api/games")
		games.POST("", gameController.CreateGame)

		req := &model.CreateGameRequest{
			LeetCodeID: uuid.New(),
		}

		reqBody, _ := json.Marshal(req)
		w := httptest.NewRecorder()
		request := httptest.NewRequest("POST", "/api/games", bytes.NewBuffer(reqBody))
		request.Header.Set("Content-Type", "application/json")

		r.ServeHTTP(w, request)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestGetGame(t *testing.T) {
	t.Run("successful_get_game", func(t *testing.T) {
		r, mockService, _ := setupGameTest()

		gameID := uuid.New()
		expectedGame := &model.GameResponse{
			ID:     gameID,
			Status: model.GameStatusWaiting,
		}

		mockService.On("GetGame", gameID).Return(expectedGame, nil)

		w := httptest.NewRecorder()
		request := httptest.NewRequest("GET", "/api/games/"+gameID.String(), nil)

		r.ServeHTTP(w, request)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response["success"].(bool))
		assert.NotNil(t, response["game"])

		mockService.AssertExpectations(t)
	})
}

func TestJoinGame(t *testing.T) {
	t.Run("successful_join_game", func(t *testing.T) {
		r := gin.New() // 새로운 라우터 생성
		mockService := new(MockGameService)
		log := zerolog.New(zerolog.NewTestWriter(nil)).With().Timestamp().Logger()
		testLogger := logger.NewZerologLogger(log)
		gameController := NewGameController(mockService, testLogger)

		userID := uuid.New()
		gameID := uuid.New()
		expectedGame := &model.GameResponse{
			ID: gameID,
			Opponent: &model.UserResponse{
				ID: userID,
			},
			Status: model.GameStatusPlaying,
		}

		// 미들웨어 설정
		r.Use(func(c *gin.Context) {
			c.Set("userID", userID) // 테스트에서 사용할 특정 userID 설정
			c.Next()
		})

		// 라우트 설정
		games := r.Group("/api/games")
		games.POST("/:id/join", gameController.JoinGame)

		mockService.On("JoinGame", gameID, userID).Return(expectedGame, nil)

		w := httptest.NewRecorder()
		request := httptest.NewRequest("POST", "/api/games/"+gameID.String()+"/join", nil)

		r.ServeHTTP(w, request)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response["success"].(bool))
		assert.NotNil(t, response["game"])

		mockService.AssertExpectations(t)
	})

	t.Run("unauthorized_join_game", func(t *testing.T) {
		r := gin.New()
		mockService := new(MockGameService)
		log := zerolog.New(zerolog.NewTestWriter(nil)).With().Timestamp().Logger()
		testLogger := logger.NewZerologLogger(log)
		gameController := NewGameController(mockService, testLogger)

		gameID := uuid.New()

		// 라우트 설정 (미들웨어 없이)
		games := r.Group("/api/games")
		games.POST("/:id/join", gameController.JoinGame)

		w := httptest.NewRecorder()
		request := httptest.NewRequest("POST", "/api/games/"+gameID.String()+"/join", nil)

		r.ServeHTTP(w, request)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestSubmitSolution(t *testing.T) {
	t.Run("successful_submit_solution", func(t *testing.T) {
		// Create a new router and controller setup
		gin.SetMode(gin.TestMode)
		r := gin.New()
		mockService := new(MockGameService)
		log := zerolog.New(zerolog.NewTestWriter(nil)).With().Timestamp().Logger()
		testLogger := logger.NewZerologLogger(log)
		gameController := NewGameController(mockService, testLogger)

		userID := uuid.New()
		gameID := uuid.New()
		req := &model.SubmitSolutionRequest{
			Code:     "function solution() { return true; }",
			Language: "javascript",
		}

		expectedResult := &model.SubmitSolutionResponse{
			IsWinner: true,
			Message:  "Congratulations! You won!",
		}

		// Set up middleware before routes
		r.Use(func(c *gin.Context) {
			c.Set("userID", userID)
			c.Next()
		})

		// Set up routes after middleware
		games := r.Group("/api/games")
		games.POST("/:id/submit", gameController.SubmitSolution)

		mockService.On("SubmitSolution", gameID, userID, req).Return(expectedResult, nil)

		reqBody, _ := json.Marshal(req)
		w := httptest.NewRecorder()
		request := httptest.NewRequest("POST", "/api/games/"+gameID.String()+"/submit", bytes.NewBuffer(reqBody))
		request.Header.Set("Content-Type", "application/json")

		r.ServeHTTP(w, request)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.True(t, response["success"].(bool))
		assert.True(t, response["is_winner"].(bool))

		mockService.AssertExpectations(t)
	})
}
