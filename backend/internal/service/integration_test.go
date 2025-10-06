package service

import (
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/testutil"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// Integration test for the complete matchmaking flow
func TestMatchmakingIntegration_Success(t *testing.T) {
	// Setup
	logger := testutil.SetupTestLogger()
	mockMatchService := &MockMatchService{}
	var mockRDB *redis.Client

	// Create matchmaking service (no WebSocket dependency)
	matchmakingService := NewMatchmakingService(mockMatchService, mockRDB, logger)

	// Create WebSocket service (constructed for hub tests only, no bus in this test)
	mockUserRepository := &MockUserRepository{}
	_ = NewWebSocketService(mockRDB, logger, matchmakingService, mockUserRepository, nil)

	// Test data
	player1ID := uuid.New()
	player2ID := uuid.New()
	difficulty := "medium"

	// Mock successful match creation
	mockMatch := &model.Match{
		ID:        uuid.New(),
		PlayerAID: player1ID,
		PlayerBID: &player2ID,
		Status:    "playing",
	}

	mockMatchService.On("CreateMatch", player1ID, player2ID, difficulty, "casual_pvp").Return(mockMatch, nil)

	// Execute
    result, err := matchmakingService.CreateMatch(player1ID, player2ID, difficulty, "casual_pvp")

	// Assert
	assert.NoError(t, err)
	assert.Equal(t, mockMatch, result)
	mockMatchService.AssertExpectations(t)
}

// Integration test for WebSocket service initialization
func TestWebSocketIntegration_ServiceInitialization(t *testing.T) {
	// Setup
	logger := testutil.SetupTestLogger()
	mockMatchmakingService := &MockMatchmakingService{}
	mockUserRepository := &MockUserRepository{}

	var mockRDB *redis.Client

	// Create WebSocket service
	wsService := NewWebSocketService(mockRDB, logger, mockMatchmakingService, mockUserRepository, nil)

	// Initialize hub
	hub := wsService.InitHub()

	// Assert hub is properly initialized
	assert.NotNil(t, hub)
	assert.NotNil(t, hub.clients)
	assert.NotNil(t, hub.matchClients)
	assert.NotNil(t, hub.matchingClients)
	assert.NotNil(t, hub.register)
	assert.NotNil(t, hub.unregister)
	assert.NotNil(t, hub.broadcast)
	assert.NotNil(t, hub.matchBroadcast)
	assert.NotNil(t, hub.startMatching)
	assert.NotNil(t, hub.cancelMatching)
	assert.Equal(t, mockMatchmakingService, hub.matchmakingService)
	assert.Equal(t, mockUserRepository, hub.userRepository)
	assert.Equal(t, logger, hub.logger)
}

// Integration test for error handling in matchmaking
func TestMatchmakingIntegration_ErrorHandling(t *testing.T) {
	// Setup
	logger := testutil.SetupTestLogger()
	mockMatchService := &MockMatchService{}
	var mockRDB *redis.Client

	matchmakingService := NewMatchmakingService(mockMatchService, mockRDB, logger)

	player1ID := uuid.New()
	player2ID := uuid.New()
	difficulty := "hard"

	// Mock match creation failure
	mockMatchService.On("CreateMatch", player1ID, player2ID, difficulty, "casual_pvp").Return((*model.Match)(nil), assert.AnError)

	// Execute
    result, err := matchmakingService.CreateMatch(player1ID, player2ID, difficulty, "casual_pvp")

	// Assert
	assert.Error(t, err)
	assert.Nil(t, result)
	mockMatchService.AssertExpectations(t)
}
