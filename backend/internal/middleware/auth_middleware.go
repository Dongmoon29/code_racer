package middleware

import (
	"net/http"

	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AuthMiddleware 인증 관련 미들웨어
type AuthMiddleware struct {
	authService    interfaces.AuthService
	logger         logger.Logger
	userRepository interfaces.UserRepository
}

// NewAuthMiddleware AuthMiddleware 인스턴스 생성
func NewAuthMiddleware(authService interfaces.AuthService, userRepository interfaces.UserRepository, logger logger.Logger) *AuthMiddleware {
	return &AuthMiddleware{
		authService:    authService,
		userRepository: userRepository,
		logger:         logger,
	}
}

// APIAuthRequired API 인증이 필요한 라우트에 대한 미들웨어
func (m *AuthMiddleware) APIAuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenString string

		// Authorization 헤더에서 Bearer 토큰 확인
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" && len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			tokenString = authHeader[7:]
			m.logger.Debug().Msg("Token found in Authorization header")
		} else {
			m.logger.Warn().Msg("No Authorization header found")
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authorization header required: Bearer <token>",
			})
			c.Abort()
			return
		}

		// 토큰 검증
		claims, err := m.authService.ValidateToken(tokenString)
		if err != nil {
			m.logger.Error().
				Err(err).
				Msg("Invalid or expired token")
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// 사용자 정보 조회
		userID, err := uuid.Parse(claims.UserID)
		if err != nil {
			m.logger.Error().
				Err(err).
				Str("userIDInToken", claims.UserID).
				Msg("Invalid user ID in token")
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Invalid user ID in token",
			})
			c.Abort()
			return
		}

		user, err := m.userRepository.FindByID(userID)
		if err != nil {
			m.logger.Error().
				Err(err).
				Str("userID", userID.String()).
				Msg("Failed to find user")
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid user",
			})
			c.Abort()
			return
		}

		// context에 사용자 정보 저장
		c.Set("userID", user.ID)
		c.Set("email", claims.Email)
		c.Set("userRole", user.Role)

		c.Next()
	}
}

// WebSocketAuthRequired 웹소켓 연결을 위한 인증 미들웨어
func (m *AuthMiddleware) WebSocketAuthRequired() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var tokenString string

		// Authorization 헤더에서 Bearer 토큰 확인
		authHeader := ctx.GetHeader("Authorization")
		if authHeader != "" && len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			tokenString = authHeader[7:]
			m.logger.Debug().Msg("Token found in Authorization header")
		} else {
			// 쿼리 파라미터에서 토큰 확인 (fallback)
			if tokenParam := ctx.Query("token"); tokenParam != "" {
				tokenString = tokenParam
				m.logger.Debug().Msg("Token found in query parameter")
			} else {
				m.logger.Warn().Msg("No Authorization header or token parameter found for WebSocket connection")
				ctx.JSON(http.StatusUnauthorized, gin.H{
					"success": false,
					"message": "Authorization header required: Bearer <token>",
				})
				ctx.Abort()
				return
			}
		}

		m.validateAndSetContext(ctx, tokenString)
	}
}

// validateAndSetContext 토큰 검증 및 컨텍스트 설정 공통 로직
func (m *AuthMiddleware) validateAndSetContext(ctx *gin.Context, tokenString string) {
	// 토큰 파싱
	claims, err := m.authService.ValidateToken(tokenString)
	if err != nil {
		logMsg := "Invalid or expired token"
		if len(tokenString) > 20 {
			logMsg += " (token prefix: " + tokenString[:20] + "...)"
		}
		m.logger.Error().
			Err(err).
			Msg(logMsg)
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid or expired token",
		})
		ctx.Abort()
		return
	}

	// 사용자 ID를 컨텍스트에 저장
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		m.logger.Error().
			Err(err).
			Str("userIDInToken", claims.UserID).
			Msg("Invalid user ID in token")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Invalid user ID in token",
		})
		ctx.Abort()
		return
	}

	// 사용자 정보 조회
	user, err := m.userRepository.FindByID(userID)
	if err != nil {
		m.logger.Error().
			Err(err).
			Str("userID", userID.String()).
			Msg("Failed to find user")
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid user",
		})
		ctx.Abort()
		return
	}

	ctx.Set("userID", userID)
	ctx.Set("email", claims.Email)
	ctx.Set("userRole", user.Role)
	ctx.Next()
}
