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

// MockEvent는 zerolog.Event를 모킹하기 위한 구조체입니다
type MockEvent struct {
	mock.Mock
}

func (e *MockEvent) Msg(msg string) {
	e.Called(msg)
}

func (e *MockEvent) Str(key, value string) *zerolog.Event {
	e.Called(key, value)
	return (*zerolog.Event)(nil)
}

func (e *MockEvent) Int(key string, value int) *zerolog.Event {
	e.Called(key, value)
	return (*zerolog.Event)(nil)
}

func (e *MockEvent) Err(err error) *zerolog.Event {
	e.Called(err)
	return (*zerolog.Event)(nil)
}

// MockLogger는 logger.Logger 인터페이스를 구현합니다
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

// MockWebSocketService는 WebSocketService 인터페이스의 mock 구현체입니다
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

func (m *MockWebSocketService) HandleConnection(conn *websocket.Conn, userID uuid.UUID, gameID uuid.UUID) {
	m.Called(conn, userID, gameID)
}

func (m *MockWebSocketService) BroadcastToGame(gameID uuid.UUID, message []byte) {
	m.Called(gameID, message)
}

// setupWebSocketTest WebSocket 테스트를 위한 설정을 수행합니다
func setupWebSocketTest() (*gin.Engine, *MockWebSocketService, *WebSocketController) {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	mockService := new(MockWebSocketService)
	mockLogger := new(MockLogger)
	mockEvent := new(MockEvent)

	// 기본 Mock 설정
	mockEvent.On("Msg", mock.Anything).Return()
	mockEvent.On("Str", mock.Anything, mock.Anything).Return(mockEvent)
	mockLogger.On("Info").Return(mockEvent)
	mockLogger.On("Warn").Return(mockEvent)
	mockLogger.On("Error").Return(mockEvent)

	wsController := NewWebSocketController(mockService, mockLogger)

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

		router.GET("/ws/:gameId", mockAuthMiddleware, controller.HandleWebSocket)

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

		// 인증된 사용자로 설정하는 미들웨어 추가
		r.Use(func(c *gin.Context) {
			c.Set("userID", uuid.New())
			c.Next()
		})

		r.GET("/ws/:gameId", wsController.HandleWebSocket)

		w := httptest.NewRecorder()
		req := httptest.NewRequest("GET", "/ws/invalid-game-id", nil)

		r.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("successful_connection", func(t *testing.T) {
		// 테스트 서버와 라우터 설정
		gin.SetMode(gin.TestMode)
		router := gin.New()

		// 모의 서비스 설정
		mockService := new(MockWebSocketService)
		mockLogger := new(MockLogger)
		mockEvent := new(MockEvent)

		// Logger mock 설정
		mockEvent.On("Msg", mock.Anything).Return()
		mockEvent.On("Str", mock.Anything, mock.Anything).Return(mockEvent)
		mockLogger.On("Info").Return(mockEvent)

		controller := NewWebSocketController(mockService, mockLogger)

		// 테스트용 UUID 생성
		userID := uuid.New()
		gameID := uuid.New()

		// HandleConnection이 호출될 것을 명시적으로 기대
		mockService.On("HandleConnection",
			mock.AnythingOfType("*websocket.Conn"),
			mock.MatchedBy(func(u uuid.UUID) bool {
				return u == userID
			}),
			mock.MatchedBy(func(g uuid.UUID) bool {
				return g == gameID
			}),
		).Return()

		// 인증 미들웨어 시뮬레이션
		router.Use(func(c *gin.Context) {
			c.Set("userID", userID)
			c.Next()
		})

		// WebSocket 핸들러 등록
		router.GET("/ws/:gameId", controller.HandleWebSocket)

		// 테스트 서버 생성
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			router.ServeHTTP(w, r)
		}))
		defer server.Close()

		// WebSocket URL 생성
		wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws/" + gameID.String()

		// WebSocket 클라이언트 다이얼러 설정
		dialer := websocket.Dialer{
			HandshakeTimeout: 5 * time.Second,
			// 테스트 환경에서는 TLS 검증 건너뛰기
			TLSClientConfig: &tls.Config{
				InsecureSkipVerify: true,
			},
		}

		// WebSocket 연결
		conn, _, err := dialer.Dial(wsURL, nil)
		assert.NoError(t, err)
		if conn != nil {
			defer conn.Close()
		}

		// 약간의 지연을 주어 HandleConnection이 호출될 시간을 확보
		time.Sleep(100 * time.Millisecond)

		// 기대 호출 검증
		mockService.AssertExpectations(t)
	})
}

func TestWebSocketUpgrader(t *testing.T) {
	t.Run("check_origin_allows_all_in_development", func(t *testing.T) {
		// upgrader의 CheckOrigin 함수 테스트
		result := upgrader.CheckOrigin(&http.Request{
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
	mockLogger.On("Info").Return(mockEvent)

	controller := NewWebSocketController(mockService, mockLogger)

	assert.NotNil(t, controller)
	assert.Equal(t, mockService, controller.wsService)
	assert.Equal(t, mockLogger, controller.logger)
}
