package controller

import (
	"net/http"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// WebSocketController handles WebSocket-related operations
type WebSocketController struct {
	wsService service.WebSocketService
	logger    logger.Logger
	upgrader  websocket.Upgrader
}

// WebSocket configuration constants
const (
	defaultReadBufferSize  = 1024
	defaultWriteBufferSize = 1024
)

// NewWebSocketController creates a new WebSocketController instance
func NewWebSocketController(wsService service.WebSocketService, logger logger.Logger, allowedOrigins []string, environment string) *WebSocketController {
	return &WebSocketController{
		wsService: wsService,
		logger:    logger,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  defaultReadBufferSize,
			WriteBufferSize: defaultWriteBufferSize,
			CheckOrigin:     createOriginChecker(allowedOrigins, environment),
		},
	}
}

// createOriginChecker creates a testable origin checker function
func createOriginChecker(allowedOrigins []string, environment string) func(r *http.Request) bool {
	return func(r *http.Request) bool {
		return isOriginAllowed(r.Header.Get("Origin"), allowedOrigins, environment)
	}
}

// isOriginAllowed checks if the origin is allowed (testable pure function)
func isOriginAllowed(origin string, allowedOrigins []string, environment string) bool {
	if origin == "" {
		return true // Allow when Origin header is missing (some clients)
	}

	// Default allowed origins
	defaultOrigins := []string{
		"http://localhost:3000",
		"http://localhost:3001",
		"https://localhost:3000",
		"https://localhost:3001",
	}

	// Combine default and configured origins
	allOrigins := append(defaultOrigins, allowedOrigins...)

	// Check against allowed origins
	for _, allowed := range allOrigins {
		if origin == allowed {
			return true
		}
	}

	// Allow all origins in development environment
	if environment == "development" {
		return true
	}

	// Allow Cloud Run domain in production environment
	if strings.Contains(origin, "asia-northeast3.run.app") {
		return true
	}

	// Allow coderacer.pro domain
	if strings.Contains(origin, "coderacer.pro") {
		return true
	}

	return false
}

// HandleWebSocket handles WebSocket connection requests
func (c *WebSocketController) HandleWebSocket(ctx *gin.Context) {
	// JWT token validation
	userID, exists := ctx.Get("userID")
	if !exists {
		c.logger.Error().Msg("WebSocket authentication failed: userID not found in context")
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	// Parse match ID
	matchID, err := uuid.Parse(ctx.Param("matchId"))
	if err != nil {
		c.logger.Error().Err(err).Str("matchId", ctx.Param("matchId")).Msg("Invalid match ID format")
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid match ID",
		})
		return
	}

	// Attempt to upgrade HTTP connection to WebSocket connection
	conn, err := c.upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		c.logger.Error().Err(err).Msg("WebSocket upgrade failed")
		return
	}

	// Handle WebSocket connection
	c.logger.Info().
		Str("userId", userID.(uuid.UUID).String()).
		Str("matchId", matchID.String()).
		Msg("WebSocket connection successful")

	c.wsService.HandleConnection(conn, userID.(uuid.UUID), matchID)
}

// HandleMatchmaking handles WebSocket connection requests for matchmaking
func (c *WebSocketController) HandleMatchmaking(ctx *gin.Context) {
	// JWT token validation
	userID, exists := ctx.Get("userID")
	if !exists {
		c.logger.Error().Msg("WebSocket authentication failed: userID not found in context")
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	// Attempt to upgrade HTTP connection to WebSocket connection
	conn, err := c.upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		c.logger.Error().Err(err).Msg("WebSocket upgrade failed")
		return
	}

	// Handle WebSocket connection for matchmaking (use special UUID for matching)
	matchingGameID := uuid.MustParse("00000000-0000-0000-0000-000000000000")

	c.logger.Info().
		Str("userId", userID.(uuid.UUID).String()).
		Msg("WebSocket matchmaking connection successful")

	c.wsService.HandleConnection(conn, userID.(uuid.UUID), matchingGameID)
}
