package controller

import (
	"crypto/tls"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/Dongmoon29/code_racer/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockEvent is a struct for mocking zerolog.Event
type MockEvent struct {
	mock.Mock
}

func (e *MockEvent) Msg(msg string) {
	e.Called(msg)
}

func (e *MockEvent) Str(key, value string) *MockEvent {
	e.Called(key, value)
	return e
}

func (e *MockEvent) Int(key string, value int) *MockEvent {
	e.Called(key, value)
	return e
}

func (e *MockEvent) Err(err error) *MockEvent {
	e.Called(err)
	return e
}

// MockLogger implements the logger.Logger interface
type MockLogger struct {
	mock.Mock
}

func (m *MockLogger) Debug() *zerolog.Event {
	args := m.Called()
	return args.Get(0).(*zerolog.Event)
}

func (m *MockLogger) Info() *zerolog.Event {
	args := m.Called()
	return args.Get(0).(*zerolog.Event)
}

func (m *MockLogger) Warn() *zerolog.Event {
	args := m.Called()
	return args.Get(0).(*zerolog.Event)
}

func (m *MockLogger) Error() *zerolog.Event {
	args := m.Called()
	return args.Get(0).(*zerolog.Event)
}

func (m *MockLogger) Fatal() *zerolog.Event {
	args := m.Called()
	return args.Get(0).(*zerolog.Event)
}

// MockWebSocketService is a mock implementation of the WebSocketService interface
type MockWebSocketService struct {
	mock.Mock
}

func (m *MockWebSocketService) InitHub() *service.Hub {
	args := m.Called()
	if args.Get(0) == nil {
		return nil
	}
	return args.Get(0).(*service.Hub)
}

func (m *MockWebSocketService) HandleConnection(conn *websocket.Conn, userID uuid.UUID, matchID uuid.UUID) {
	m.Called(conn, userID, matchID)
}

func (m *MockWebSocketService) BroadcastToMatch(matchID uuid.UUID, message []byte) {
	m.Called(matchID, message)
}

// setupWebSocketTest performs setup configuration for WebSocket tests
func setupWebSocketTest() (*gin.Engine, *MockWebSocketService, *WebSocketController) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	mockService := new(MockWebSocketService)
	mockLogger := new(MockLogger)
	mockEvent := new(MockEvent)

	// Basic Mock configuration
	mockEvent.On("Msg", mock.Anything).Return()
	mockEvent.On("Str", mock.Anything, mock.Anything).Return(mockEvent)
	mockLogger.On("Info").Return((*zerolog.Event)(nil))
	mockLogger.On("Warn").Return((*zerolog.Event)(nil))
	mockLogger.On("Error").Return((*zerolog.Event)(nil))

	wsController := NewWebSocketController(mockService, mockLogger, []string{"http://localhost:3000"}, "development")

	return r, mockService, wsController
}

func TestHandleWebSocket(t *testing.T) {
	t.Run("unauthorized_connection", func(t *testing.T) {
		router, _, controller := setupWebSocketTest()

		// Add auth middleware to the route
		mockAuthMiddleware := func(c *gin.Context) {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authentication required",
			})
			c.Abort()
		}

		router.GET("/ws/:matchId", mockAuthMiddleware, controller.HandleWebSocket)

		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/ws/"+uuid.New().String(), nil)

		router.ServeHTTP(w, req)

		// Check status code
		assert.Equal(t, http.StatusUnauthorized, w.Code)

		// Check response body
		expectedBody := `{"message":"Authentication required","success":false}`
		assert.JSONEq(t, expectedBody, w.Body.String())
	})

	t.Run("invalid_game_id", func(t *testing.T) {
		r, _, wsController := setupWebSocketTest()

		// Add middleware to set authenticated user
		r.Use(func(c *gin.Context) {
			c.Set("userID", uuid.New())
			c.Next()
		})

		r.GET("/ws/:matchId", wsController.HandleWebSocket)

		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/ws/invalid-game-id", nil)

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("successful_connection", func(t *testing.T) {
		// Setup test server and router
		gin.SetMode(gin.TestMode)
		router := gin.New()

		// Setup mock services
		mockService := new(MockWebSocketService)
		mockLogger := new(MockLogger)
		mockEvent := new(MockEvent)

		// Logger mock configuration
		mockEvent.On("Msg", mock.Anything).Return()
		mockEvent.On("Str", mock.Anything, mock.Anything).Return(mockEvent)
		mockLogger.On("Info").Return((*zerolog.Event)(nil))

		controller := NewWebSocketController(mockService, mockLogger, []string{"http://localhost:3000"}, "development")

		// Generate test UUIDs
		userID := uuid.New()
		matchID := uuid.New()

		// Explicitly expect HandleConnection to be called
		mockService.On("HandleConnection",
			mock.AnythingOfType("*websocket.Conn"),
			mock.MatchedBy(func(u uuid.UUID) bool {
				return u == userID
			}),
			mock.MatchedBy(func(g uuid.UUID) bool {
				return g == matchID
			}),
		).Return()

		// Simulate authentication middleware
		router.Use(func(c *gin.Context) {
			c.Set("userID", userID)
			c.Next()
		})

		// Register WebSocket handler
		router.GET("/ws/:matchId", controller.HandleWebSocket)

		// Create test server
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			router.ServeHTTP(w, r)
		}))
		defer server.Close()

		// Generate WebSocket URL
		wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws/" + matchID.String()

		// Configure WebSocket client dialer
		dialer := websocket.Dialer{
			HandshakeTimeout: 5 * time.Second,
			// Skip TLS verification in test environment
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		}

		// Connect WebSocket
		conn, _, err := dialer.Dial(wsURL, nil)
		assert.NoError(t, err)
		if conn != nil {
			defer conn.Close()
		}

		// Give some delay to ensure HandleConnection is called
		time.Sleep(100 * time.Millisecond)

		// Verify expected calls
		mockService.AssertExpectations(t)
	})
}

func TestWebSocketUpgrader(t *testing.T) {
	t.Run("check_origin_allows_all_in_development", func(t *testing.T) {
		// Create a test controller to access the upgrader
		mockService := new(MockWebSocketService)
		mockLogger := new(MockLogger)
		controller := NewWebSocketController(mockService, mockLogger, []string{"http://localhost:3000"}, "development")

		// Test upgrader's CheckOrigin function
		result := controller.upgrader.CheckOrigin(&http.Request{
			Header: http.Header{
				"Origin": []string{"http://localhost:3000"},
			},
		})
		assert.True(t, result, "Development environment should allow all origins")
	})
}

func TestNewWebSocketController(t *testing.T) {
	mockService := new(MockWebSocketService)
	mockLogger := new(MockLogger)
	mockEvent := new(MockEvent)

	mockEvent.On("Msg", mock.Anything).Return()
	mockEvent.On("Str", mock.Anything, mock.Anything).Return(mockEvent)
	mockLogger.On("Info").Return((*zerolog.Event)(nil))

	controller := NewWebSocketController(mockService, mockLogger, []string{"http://localhost:3000"}, "development")

	assert.NotNil(t, controller)
	assert.Equal(t, mockService, controller.wsService)
	assert.Equal(t, mockLogger, controller.logger)
}
