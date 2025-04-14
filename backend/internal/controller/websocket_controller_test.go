package controller

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockLogger implements logger.Logger interface for testing
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
	log := zerolog.New(zerolog.NewTestWriter(nil)).With().Timestamp().Logger()
	testLogger := logger.NewZerologLogger(log)
	wsController := NewWebSocketController(mockService, testLogger)

	return r, mockService, wsController
}

func TestHandleWebSocket(t *testing.T) {
	t.Run("unauthorized_connection", func(t *testing.T) {
		r, _, wsController := setupWebSocketTest()

		// WebSocket 라우트 설정
		r.GET("/ws/:gameId", wsController.HandleWebSocket)

		// 테스트 서버 생성
		server := httptest.NewServer(r)
		defer server.Close()

		// WebSocket URL 생성
		wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws/" + uuid.New().String()

		// WebSocket 연결 시도
		_, _, err := websocket.DefaultDialer.Dial(wsURL, nil)

		// 인증되지 않은 요청이므로 연결이 실패해야 함
		assert.Error(t, err)
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
		log := zerolog.New(zerolog.NewTestWriter(nil)).With().Timestamp().Logger()
		testLogger := logger.NewZerologLogger(log)
		controller := NewWebSocketController(mockService, testLogger)

		// 테스트용 UUID 생성
		userID := uuid.New()
		gameID := uuid.New()

		// HandleConnection이 호출될 것을 기대
		mockService.On("HandleConnection", mock.AnythingOfType("*websocket.Conn"), userID, gameID).Return()

		// 인증 미들웨어 시뮬레이션
		router.Use(func(c *gin.Context) {
			c.Set("userID", userID)
			c.Next()
		})

		// WebSocket 핸들러 등록
		router.GET("/ws/:gameId", controller.HandleWebSocket)

		// 테스트 서버 생성
		server := httptest.NewServer(router)
		defer server.Close()

		// WebSocket URL 생성
		wsURL := "ws" + strings.TrimPrefix(server.URL, "http") + "/ws/" + gameID.String()

		// WebSocket 클라이언트 다이얼러 설정
		dialer := websocket.Dialer{
			HandshakeTimeout: 5 * time.Second,
		}

		// WebSocket 연결
		conn, resp, err := dialer.Dial(wsURL, nil)

		// 연결 성공 확인
		assert.NoError(t, err)
		assert.NotNil(t, conn)
		if conn != nil {
			defer conn.Close()
		}
		assert.Equal(t, http.StatusSwitchingProtocols, resp.StatusCode)

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
	log := zerolog.New(zerolog.NewTestWriter(nil)).With().Timestamp().Logger()
	testLogger := logger.NewZerologLogger(log)

	controller := NewWebSocketController(mockService, testLogger)

	assert.NotNil(t, controller)
	assert.Equal(t, mockService, controller.wsService)
	assert.Equal(t, testLogger, controller.logger)
}
