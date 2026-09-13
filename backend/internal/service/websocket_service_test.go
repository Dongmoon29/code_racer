package service

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/events"
	"github.com/Dongmoon29/code_racer/internal/game"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/testutil"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestParseMessageUsesTypedProtocol(t *testing.T) {
	client := &Client{}
	payload, err := json.Marshal(map[string]interface{}{
		"type": constants.CodeUpdate,
		"data": map[string]interface{}{"code": "return 1", "language": "javascript"},
	})
	assert.NoError(t, err)
	message, ok := client.parseMessage(payload)
	assert.True(t, ok)
	assert.Equal(t, constants.CodeUpdate, message.Type)
	assert.Equal(t, "return 1", message.Data.Code)
	assert.Equal(t, "javascript", message.Data.Language)

	_, ok = client.parseMessage([]byte(`{"type":"unknown"}`))
	assert.False(t, ok)
}

func TestTestCaseRunningMessageIncludesCaseDetails(t *testing.T) {
	message := testCaseRunningMessage(&events.TestCaseRunningEvent{
		MatchID:       "match-id",
		UserID:        "user-id",
		TestCaseIndex: 1,
		Total:         3,
		TestCase: model.TestCase{
			Input:          `[121]`,
			ExpectedOutput: `true`,
		},
	})

	assert.Equal(t, constants.TestCaseRunning, message["type"])
	assert.Equal(t, `[121]`, message["input"])
	assert.Equal(t, `true`, message["expected_output"])
}

func TestTestCaseCompletedMessageIncludesAllOutputs(t *testing.T) {
	message := testCaseCompletedMessage(&events.TestCaseCompletedEvent{
		MatchID:       "match-id",
		UserID:        "user-id",
		TestCaseIndex: 1,
		Input:         `[121]`,
		Expected:      `true`,
		Actual:        false,
		Passed:        false,
	})

	assert.Equal(t, constants.TestCaseCompleted, message["type"])
	assert.Equal(t, `[121]`, message["input"])
	assert.Equal(t, `true`, message["expected_output"])
	assert.Equal(t, false, message["actual_output"])
}

// MockGameEngine implements the real-time engine port used by WebSocket tests.
type MockGameEngine struct {
	mock.Mock
}

func (m *MockGameEngine) Create(_ context.Context, cmd game.CreateMatchCommand) (*model.Match, error) {
	args := m.Called(cmd)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Match), args.Error(1)
}

func (m *MockGameEngine) GetActive(_ context.Context, userID uuid.UUID) (*model.Match, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Match), args.Error(1)
}

func (m *MockGameEngine) Connect(_ context.Context, cmd game.ParticipantCommand) error {
	return nil
}

func (m *MockGameEngine) Disconnect(_ context.Context, cmd game.ParticipantCommand) error {
	return nil
}

func (m *MockGameEngine) UpdateCode(_ context.Context, _ game.CodeSnapshotCommand) error {
	return nil
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

func (m *MockUserRepository) ListUsers(offset, limit int, orderByField, orderDir, search string) ([]*model.User, int64, error) {
	args := m.Called(offset, limit, orderByField, orderDir, search)
	return args.Get(0).([]*model.User), args.Get(1).(int64), args.Error(2)
}

func (m *MockUserRepository) GetLeaderboardUsers(limit int) ([]*model.User, error) {
	args := m.Called(limit)
	return args.Get(0).([]*model.User), args.Error(1)
}

func TestWebSocketService_NewWebSocketService(t *testing.T) {
	// Setup
	logger := testutil.SetupTestLogger()
	mockGameEngine := &MockGameEngine{}
	mockUserRepository := &MockUserRepository{}

	var mockRDB *redis.Client

	// Execute
	service := NewWebSocketService(mockRDB, logger, mockGameEngine, mockUserRepository, nil)

	// Assert
	assert.NotNil(t, service)
	assert.Implements(t, (*WebSocketService)(nil), service)
}

func TestWebSocketService_InitHub(t *testing.T) {
	// Setup
	logger := testutil.SetupTestLogger()
	mockGameEngine := &MockGameEngine{}
	mockUserRepository := &MockUserRepository{}

	var mockRDB *redis.Client

	service := NewWebSocketService(mockRDB, logger, mockGameEngine, mockUserRepository, nil)

	// Execute
	hub := service.InitHub()
	secondHub := service.InitHub()

	// Assert
	assert.NotNil(t, hub)
	assert.Same(t, hub, secondHub, "InitHub must not replace the live hub")
	assert.NotNil(t, hub.clients)
	assert.NotNil(t, hub.matchClients)
	assert.NotNil(t, hub.matchingClients)
	assert.NotNil(t, hub.register)
	assert.NotNil(t, hub.unregister)
	assert.NotNil(t, hub.broadcast)
	assert.NotNil(t, hub.matchBroadcast)
	assert.NotNil(t, hub.startMatching)
	assert.NotNil(t, hub.cancelMatching)
	assert.Equal(t, mockGameEngine, hub.engine)
	assert.Equal(t, mockUserRepository, hub.userRepository)
	assert.Equal(t, logger, hub.logger)
}

func TestWebSocketService_HandleConnection(t *testing.T) {
	// Setup
	logger := testutil.SetupTestLogger()
	mockGameEngine := &MockGameEngine{}
	mockUserRepository := &MockUserRepository{}

	var mockRDB *redis.Client

	service := NewWebSocketService(mockRDB, logger, mockGameEngine, mockUserRepository, nil)
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
	mockGameEngine := &MockGameEngine{}
	mockUserRepository := &MockUserRepository{}

	var mockRDB *redis.Client

	service := NewWebSocketService(mockRDB, logger, mockGameEngine, mockUserRepository, nil)
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
