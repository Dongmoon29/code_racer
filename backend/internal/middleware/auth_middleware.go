package middleware

import (
	"net/http"

	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/util"
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
		tokenString := m.extractToken(c, false)
		if tokenString == "" {
			m.logger.Warn().Msg("No Authorization header or cookie found")
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authentication required",
			})
			c.Abort()
			return
		}
		m.validateAndSetContext(c, tokenString, true)
	}
}

func (m *AuthMiddleware) WebSocketAuthRequired() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		tokenString := m.extractToken(ctx, true)
		if tokenString == "" {
			m.logger.Warn().Msg("No Authorization header, cookie, or token parameter found for WebSocket connection")
			ctx.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authentication required",
			})
			ctx.Abort()
			return
		}
		m.validateAndSetContext(ctx, tokenString, false)
	}
}

// extractToken extracts JWT token from request (header, cookie, or query param)
func (m *AuthMiddleware) extractToken(c *gin.Context, allowQueryParam bool) string {
	// Priority order: Authorization header > Cookie > Query parameter (if allowed)
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" && len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		m.logger.Debug().Msg("Token found in Authorization header")
		return authHeader[7:]
	}
	
	// Check for JWT token in cookies
	if cookie, err := c.Cookie("auth_token"); err == nil && cookie != "" {
		m.logger.Debug().Str("tokenPrefix", util.MaskToken(cookie)).Msg("Token found in cookie")
		return cookie
	}
	
	// Fallback to query parameter for WebSocket (backward compatibility)
	if allowQueryParam {
		if tokenParam := c.Query("token"); tokenParam != "" {
			m.logger.Debug().Str("tokenPrefix", util.MaskToken(tokenParam)).Msg("Token found in query parameter")
			return tokenParam
		}
	}
	
	return ""
}

func (m *AuthMiddleware) validateAndSetContext(ctx *gin.Context, tokenString string, useJWTRole bool) {
	claims, err := m.authService.ValidateToken(tokenString)
	if err != nil {
		m.logger.Error().
			Err(err).
			Str("tokenPrefix", util.MaskToken(tokenString)).
			Msg("Invalid or expired token")
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
	
	// Use JWT role for API, DB role for WebSocket
	if useJWTRole {
		ctx.Set("userRole", claims.Role)
	} else {
		ctx.Set("userRole", user.Role)
	}
	
	ctx.Next()
}
