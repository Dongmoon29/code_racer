package middleware

import (
	"net/http"

	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthMiddleware struct {
	authService    interfaces.AuthService
	logger         logger.Logger
	userRepository interfaces.UserRepository
}

func NewAuthMiddleware(authService interfaces.AuthService, userRepository interfaces.UserRepository, logger logger.Logger) *AuthMiddleware {
	return &AuthMiddleware{
		authService:    authService,
		userRepository: userRepository,
		logger:         logger,
	}
}

func (m *AuthMiddleware) APIAuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenString string

		// Priority order: Authorization header > Cookie
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" && len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			tokenString = authHeader[7:]
			m.logger.Debug().Msg("Token found in Authorization header")
		} else {
			// Check for JWT token in cookies (for httpOnly cookie security)
			if cookie, err := c.Cookie("auth_token"); err == nil && cookie != "" {
				tokenString = cookie
				m.logger.Debug().Str("tokenPrefix", cookie[:min(len(cookie), 20)]).Msg("Token found in cookie")
			} else {
				m.logger.Warn().Msg("No Authorization header or cookie found")
				c.JSON(http.StatusUnauthorized, gin.H{
					"success": false,
					"message": "Authentication required",
				})
				c.Abort()
				return
			}
		}

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

		c.Set("userID", user.ID)
		c.Set("email", claims.Email)
		c.Set("userRole", claims.Role) // JWT 토큰에서 직접 role 추출

		c.Next()
	}
}

func (m *AuthMiddleware) WebSocketAuthRequired() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var tokenString string

		// Priority order: Authorization header > Cookie > Query parameter
		authHeader := ctx.GetHeader("Authorization")
		if authHeader != "" && len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			tokenString = authHeader[7:]
			m.logger.Debug().Msg("Token found in Authorization header")
		} else {
			// Check for JWT token in cookies (for httpOnly cookie security)
			if cookie, err := ctx.Cookie("auth_token"); err == nil && cookie != "" {
				tokenString = cookie
				m.logger.Debug().Str("tokenPrefix", cookie[:min(len(cookie), 20)]).Msg("Token found in cookie")
			} else if tokenParam := ctx.Query("token"); tokenParam != "" {
				// Fallback to query parameter for backward compatibility
				tokenString = tokenParam
				m.logger.Debug().Str("tokenPrefix", tokenParam[:min(len(tokenParam), 20)]).Msg("Token found in query parameter")
			} else {
				m.logger.Warn().Msg("No Authorization header, cookie, or token parameter found for WebSocket connection")
				ctx.JSON(http.StatusUnauthorized, gin.H{
					"success": false,
					"message": "Authentication required",
				})
				ctx.Abort()
				return
			}
		}

		m.validateAndSetContext(ctx, tokenString)
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func (m *AuthMiddleware) validateAndSetContext(ctx *gin.Context, tokenString string) {
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
