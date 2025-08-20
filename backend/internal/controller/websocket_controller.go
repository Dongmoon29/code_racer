package controller

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// WebSocketController 웹소켓 관련 컨트롤러
type WebSocketController struct {
	wsService service.WebSocketService
	logger    logger.Logger
}

// 웹소켓 업그레이더 설정
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		if origin == "" {
			return true // Origin 헤더가 없는 경우 허용 (일부 클라이언트)
		}

		// 허용된 오리진 목록
		allowedOrigins := []string{
			"http://localhost:3000",
			"http://localhost:3001",
			"https://localhost:3000",
			"https://localhost:3001",
		}

		// 환경 변수에서 추가 오리진 가져오기
		if frontendURL := os.Getenv("FRONTEND_URL"); frontendURL != "" {
			allowedOrigins = append(allowedOrigins, frontendURL)
			// HTTPS 버전도 추가
			if strings.HasPrefix(frontendURL, "http://") {
				httpsVersion := strings.Replace(frontendURL, "http://", "https://", 1)
				allowedOrigins = append(allowedOrigins, httpsVersion)
			}
		}

		// CORS_ALLOWED_ORIGINS 환경 변수에서 추가 오리진 가져오기
		if corsOrigins := os.Getenv("CORS_ALLOWED_ORIGINS"); corsOrigins != "" {
			origins := strings.Split(corsOrigins, ",")
			for _, o := range origins {
				o = strings.TrimSpace(o)
				if o != "" {
					allowedOrigins = append(allowedOrigins, o)
					// HTTPS 버전도 추가
					if strings.HasPrefix(o, "http://") {
						httpsVersion := strings.Replace(o, "http://", "https://", 1)
						allowedOrigins = append(allowedOrigins, httpsVersion)
					}
				}
			}
		}

		// 오리진 체크
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				return true
			}
		}

		// 개발 환경에서는 모든 오리진 허용
		if os.Getenv("ENVIRONMENT") == "development" {
			return true
		}

		// 프로덕션 환경에서도 Cloud Run 도메인 허용
		if strings.Contains(origin, "asia-northeast3.run.app") {
			return true
		}

		return false
	},
}

// NewWebSocketController WebSocketController 인스턴스 생성
func NewWebSocketController(wsService service.WebSocketService, logger logger.Logger) *WebSocketController {
	return &WebSocketController{
		wsService: wsService,
		logger:    logger,
	}
}

// HandleWebSocket 웹소켓 연결 핸들러
func (c *WebSocketController) HandleWebSocket(ctx *gin.Context) {
	log.Printf("WebSocket 연결 시도: 게임 ID = %s", ctx.Param("gameId"))

	// JWT 토큰 검증
	userID, exists := ctx.Get("userID")
	if !exists {
		log.Printf("웹소켓 인증 실패: userID가 컨텍스트에 없음")
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}
	log.Printf("인증된 사용자 ID: %s", userID.(uuid.UUID).String())

	// 게임 ID 파싱
	gameID, err := uuid.Parse(ctx.Param("gameId"))
	if err != nil {
		log.Printf("잘못된 게임 ID 형식: %s, 오류: %v", ctx.Param("gameId"), err)
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid game ID",
		})
		return
	}
	log.Printf("게임 ID 파싱 성공: %s", gameID.String())

	// HTTP 연결을 웹소켓 연결로 업그레이드 시도
	log.Printf("웹소켓 연결 업그레이드 시도")
	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		log.Printf("웹소켓 업그레이드 실패: %v", err)
		return
	}
	log.Printf("웹소켓 연결 업그레이드 성공")

	// 웹소켓 연결 처리
	log.Printf("웹소켓 서비스에 연결 전달: 사용자=%s, 게임=%s",
		userID.(uuid.UUID).String(), gameID.String())
	c.wsService.HandleConnection(conn, userID.(uuid.UUID), gameID)
}
