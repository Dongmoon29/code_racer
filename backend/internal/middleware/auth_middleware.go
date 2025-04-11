package middleware

import (
	"log"
	"net/http"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AuthMiddleware 인증 관련 미들웨어
type AuthMiddleware struct {
	authService service.AuthService
	logger      logger.Logger
}

// NewAuthMiddleware AuthMiddleware 인스턴스 생성
func NewAuthMiddleware(authService service.AuthService, logger logger.Logger) *AuthMiddleware {
	return &AuthMiddleware{
		authService: authService,
		logger:      logger,
	}
}

// APIAuthRequired API 요청을 위한 인증 미들웨어
func (m *AuthMiddleware) APIAuthRequired() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Authorization 헤더에서 토큰 추출
		authHeader := ctx.GetHeader("Authorization")
		if authHeader == "" {
			log.Println("No Authorization header provided")
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authorization header is required",
			})
			ctx.Abort()
			return
		}

		// Bearer 토큰 형식 체크
		if !strings.HasPrefix(authHeader, "Bearer ") {
			log.Println("Invalid token format in header")
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid token format",
			})
			ctx.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// 토큰 검증 및 컨텍스트 설정
		m.validateAndSetContext(ctx, tokenString)
	}
}

// WebSocketAuthRequired 웹소켓 연결을 위한 인증 미들웨어
func (m *AuthMiddleware) WebSocketAuthRequired() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// URL 쿼리 파라미터에서 토큰 추출
		tokenParam := ctx.Query("token")
		if tokenParam == "" {
			log.Println("No token query parameter provided for WebSocket")
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authentication token is required as a query parameter",
			})
			ctx.Abort()
			return
		}

		// 토큰 검증 및 컨텍스트 설정
		m.validateAndSetContext(ctx, tokenParam)
	}
}

// validateAndSetContext 토큰 검증 및 컨텍스트 설정 공통 로직
func (m *AuthMiddleware) validateAndSetContext(ctx *gin.Context, tokenString string) {
	// 토큰 파싱
	claims, err := m.authService.ValidateToken(tokenString)
	if err != nil {
		log.Println("Invalid or expired token:", err)
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid or expired token",
		})
		ctx.Abort()
		return
	}

	// 사용자 ID를 컨텍스트에 저장
	userID, err := uuid.Parse(claims.UserID.String())
	if err != nil {
		log.Println("Invalid user ID in token:", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Invalid user ID in token",
		})
		ctx.Abort()
		return
	}

	ctx.Set("userID", userID)
	ctx.Set("email", claims.Email)
	ctx.Next()
}
