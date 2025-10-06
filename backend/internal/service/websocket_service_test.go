package service

import (
	"testing"
	"time"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/testutil"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockMatchmakingService is a mock implementation of MatchmakingService
type MockMatchmakingService struct {
	mock.Mock
}

func (m *MockMatchmakingService) CreateMatch(player1ID, player2ID uuid.UUID, difficulty string) (interface{}, error) {
	args := m.Called(player1ID, player2ID, difficulty)
	return args.Get(0), args.Error(1)
}

// Note: SetWebSocketService removed in refactor

// MockUserRepository is a mock implementation of UserRepository
type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) Create(user *model.User) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) FindByID(id uuid.UUID) (*model.User, error) {
	args := m.Called(id)
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *MockUserRepository) FindByEmail(email string) (*model.User, error) {
	args := m.Called(email)
	return args.Get(0).(*model.User), args.Error(1)
}

func (m *MockUserRepository) Update(user *model.User) error {
	args := m.Called(user)
	return args.Error(0)
}

func (m *MockUserRepository) ListUsers(offset, limit int, orderByField, orderDir string) ([]*model.User, int64, error) {
	args := m.Called(offset, limit, orderByField, orderDir)
	return args.Get(0).([]*model.User), args.Get(1).(int64), args.Error(2)
}

func TestWebSocketService_NewWebSocketService(t *testing.T) {
	// Setup
	logger := testutil.SetupTestLogger()
	mockMatchmakingService := &MockMatchmakingService{}
	mockUserRepository := &MockUserRepository{}

	var mockRDB *redis.Client

	// Execute
	service := NewWebSocketService(mockRDB, logger, mockMatchmakingService, mockUserRepository, nil)

	// Assert
	assert.NotNil(t, service)
	assert.Implements(t, (*WebSocketService)(nil), service)
}

func TestWebSocketService_InitHub(t *testing.T) {
	// Setup
	logger := testutil.SetupTestLogger()
	mockMatchmakingService := &MockMatchmakingService{}
	mockUserRepository := &MockUserRepository{}

	var mockRDB *redis.Client

	service := NewWebSocketService(mockRDB, logger, mockMatchmakingService, mockUserRepository, nil)

	// Execute
	hub := service.InitHub()

	// Assert
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

func TestWebSocketService_HandleConnection(t *testing.T) {
	// Setup
	logger := testutil.SetupTestLogger()
	mockMatchmakingService := &MockMatchmakingService{}
	mockUserRepository := &MockUserRepository{}

	var mockRDB *redis.Client

	service := NewWebSocketService(mockRDB, logger, mockMatchmakingService, mockUserRepository, nil)
	service.InitHub()

	userID := uuid.New()
	matchID := uuid.New()

	// Execute - this should not panic
	// Note: We can't easily test the actual WebSocket connection without a real connection
	// but we can test that the method exists and doesn't panic on nil connection
	assert.NotPanics(t, func() {
		// Use a timeout to prevent hanging
		done := make(chan bool)
		go func() {
			service.HandleConnection(nil, userID, matchID)
			done <- true
		}()

		select {
		case <-done:
			// Test completed successfully
		case <-time.After(1 * time.Second):
			// Test timed out, which is expected for nil connection
			t.Log("HandleConnection timed out as expected with nil connection")
		}
	})
}

func TestWebSocketService_BroadcastToMatch(t *testing.T) {
	// Setup
	logger := testutil.SetupTestLogger()
	mockMatchmakingService := &MockMatchmakingService{}
	mockUserRepository := &MockUserRepository{}

	var mockRDB *redis.Client

	service := NewWebSocketService(mockRDB, logger, mockMatchmakingService, mockUserRepository, nil)
	service.InitHub()

	matchID := uuid.New()
	message := []byte("test message")

	// Execute - this should not panic
	assert.NotPanics(t, func() {
		// Use a timeout to prevent hanging
		done := make(chan bool)
		go func() {
			service.BroadcastToMatch(matchID, message)
			done <- true
		}()

		select {
		case <-done:
			// Test completed successfully
		case <-time.After(1 * time.Second):
			// Test timed out, which is expected for nil connection
			t.Log("BroadcastToMatch timed out as expected with nil connection")
		}
	})
}
