package service

import (
	"errors"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/testutil"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockMatchService is a mock implementation of MatchService
type MockMatchService struct {
	mock.Mock
}

func (m *MockMatchService) SubmitSolution(gameID uuid.UUID, userID uuid.UUID, req *model.SubmitSolutionRequest) (*model.SubmitSolutionResponse, error) {
	args := m.Called(gameID, userID, req)
	return args.Get(0).(*model.SubmitSolutionResponse), args.Error(1)
}

func (m *MockMatchService) UpdateCode(gameID uuid.UUID, userID uuid.UUID, code string) error {
	args := m.Called(gameID, userID, code)
	return args.Error(0)
}

func (m *MockMatchService) GetPlayerCode(gameID uuid.UUID, userID uuid.UUID) (string, error) {
	args := m.Called(gameID, userID)
	return args.String(0), args.Error(1)
}

func (m *MockMatchService) GetRandomLeetCodeByDifficulty(difficulty string) (*model.LeetCode, error) {
	args := m.Called(difficulty)
	return args.Get(0).(*model.LeetCode), args.Error(1)
}

func (m *MockMatchService) CreateMatch(player1ID, player2ID uuid.UUID, difficulty string) (*model.Match, error) {
	args := m.Called(player1ID, player2ID, difficulty)
	return args.Get(0).(*model.Match), args.Error(1)
}

func (m *MockMatchService) GetMatch(matchID uuid.UUID) (*model.Match, error) {
	args := m.Called(matchID)
	return args.Get(0).(*model.Match), args.Error(1)
}

// MockWebSocketService is a mock implementation of WebSocketService
type MockWebSocketService struct {
	mock.Mock
}

func (m *MockWebSocketService) InitHub() *Hub {
	args := m.Called()
	return args.Get(0).(*Hub)
}

func (m *MockWebSocketService) HandleConnection(conn *websocket.Conn, userID uuid.UUID, matchID uuid.UUID) {
	m.Called(conn, userID, matchID)
}

func (m *MockWebSocketService) BroadcastToMatch(matchID uuid.UUID, message []byte) {
	m.Called(matchID, message)
}

func TestMatchmakingService_CreateMatch_Success(t *testing.T) {
	// Setup
	logger := testutil.SetupTestLogger()
	mockMatchService := &MockMatchService{}
	mockWSService := &MockWebSocketService{}

	// Mock Redis client (we'll use a simple mock for now)
	var mockRDB *redis.Client

	service := NewMatchmakingService(mockMatchService, mockWSService, mockRDB, logger)

	player1ID := uuid.New()
	player2ID := uuid.New()
	difficulty := "medium"

	// Mock match creation success
	mockMatch := &model.Match{ID: uuid.New()}
	mockMatchService.On("CreateMatch", player1ID, player2ID, difficulty).Return(mockMatch, nil)

	// Execute
	result, err := service.CreateMatch(player1ID, player2ID, difficulty)

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, mockMatch, result)
	mockMatchService.AssertExpectations(t)
}

func TestMatchmakingService_CreateMatch_MatchServiceError(t *testing.T) {
	// Setup
	logger := testutil.SetupTestLogger()
	mockMatchService := &MockMatchService{}
	mockWSService := &MockWebSocketService{}

	var mockRDB *redis.Client

	service := NewMatchmakingService(mockMatchService, mockWSService, mockRDB, logger)

	player1ID := uuid.New()
	player2ID := uuid.New()
	difficulty := "hard"

	// Mock match creation failure
	expectedError := errors.New("failed to create match")
	mockMatchService.On("CreateMatch", player1ID, player2ID, difficulty).Return((*model.Match)(nil), expectedError)

	// Execute
	result, err := service.CreateMatch(player1ID, player2ID, difficulty)

	// Assert
	assert.Error(t, err)
	assert.Equal(t, expectedError, err)
	assert.Nil(t, result)
	mockMatchService.AssertExpectations(t)
}

func TestMatchmakingService_SetWebSocketService(t *testing.T) {
	// Setup
	logger := testutil.SetupTestLogger()
	mockMatchService := &MockMatchService{}
	mockWSService := &MockWebSocketService{}

	var mockRDB *redis.Client

	service := NewMatchmakingService(mockMatchService, mockWSService, mockRDB, logger)

	// Execute
	service.SetWebSocketService(mockWSService)

	// Assert - this is a simple setter, so we just verify it doesn't panic
	assert.NotNil(t, service)
}
