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

// Game management (active games only)
func (m *MockGameService) GetGame(gameID uuid.UUID) (*model.GameResponse, error) {
	args := m.Called(gameID)
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

// LeetCode management
func (m *MockGameService) ListLeetCodes() ([]*model.LeetCodeSummary, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*model.LeetCodeSummary), args.Error(1)
}

// REMOVED: Room-based API mocks (replaced by WebSocket matching)
// CreateGame, ListGames, JoinGame, CloseGame - no longer part of interface

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

// Matchmaking methods
func (m *MockGameService) CreateGameForMatch(player1ID, player2ID uuid.UUID, difficulty string) (*model.Game, error) {
	args := m.Called(player1ID, player2ID, difficulty)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Game), args.Error(1)
}

func (m *MockGameService) GetRandomLeetCodeByDifficulty(difficulty string) (*model.LeetCode, error) {
	args := m.Called(difficulty)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.LeetCode), args.Error(1)
}

func (m *MockGameService) CreateGameFromMatch(matchID string, userID uuid.UUID) (*model.GameResponse, error) {
	args := m.Called(matchID, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.GameResponse), args.Error(1)
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
		// Only keep APIs needed for active games
		games.GET("/:id", gameController.GetGame)                // Get game info during play
		games.POST("/:id/submit", gameController.SubmitSolution) // Submit code solution

		// REMOVED: Room-based APIs (replaced by WebSocket matching)
		// games.POST("", gameController.CreateGame)     // Replaced by auto-matching
		// games.GET("", gameController.ListGames)       // No longer needed
		// games.POST("/:id/join", gameController.JoinGame) // Replaced by auto-matching
		// games.POST("/:id/close", gameController.CloseGame) // No room concept
	}

	return r, mockService, gameController
}

// REMOVED: TestCreateGame - replaced by automatic matching system
// Room creation is no longer supported; games are created automatically via WebSocket matching

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

// REMOVED: TestJoinGame - replaced by automatic matching system
// Players are automatically matched via WebSocket; no manual room joining required

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
