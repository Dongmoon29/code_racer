package controller

import (
	"net/http"
	"os"
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
}

// WebSocket upgrader configuration
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		if origin == "" {
			return true // Allow when Origin header is missing (some clients)
		}

		// List of allowed origins
		allowedOrigins := []string{
			"http://localhost:3000",
			"http://localhost:3001",
			"https://localhost:3000",
			"https://localhost:3001",
		}

		// Get additional origins from environment variable
		if frontendURL := os.Getenv("FRONTEND_URL"); frontendURL != "" {
			allowedOrigins = append(allowedOrigins, frontendURL)
			// Also add HTTPS version
			if strings.HasPrefix(frontendURL, "http://") {
				httpsVersion := strings.Replace(frontendURL, "http://", "https://", 1)
				allowedOrigins = append(allowedOrigins, httpsVersion)
			}
		}

		// Get additional origins from CORS_ALLOWED_ORIGINS environment variable
		if corsOrigins := os.Getenv("CORS_ALLOWED_ORIGINS"); corsOrigins != "" {
			origins := strings.Split(corsOrigins, ",")
			for _, o := range origins {
				o = strings.TrimSpace(o)
				if o != "" {
					allowedOrigins = append(allowedOrigins, o)
					// Also add HTTPS version
					if strings.HasPrefix(o, "http://") {
						httpsVersion := strings.Replace(o, "http://", "https://", 1)
						allowedOrigins = append(allowedOrigins, httpsVersion)
					}
				}
			}
		}

		// Check origin
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				return true
			}
		}

		// Allow all origins in development environment
		if os.Getenv("ENVIRONMENT") == "development" {
			return true
		}

		// Also allow Cloud Run domain in production environment
		if strings.Contains(origin, "asia-northeast3.run.app") {
			return true
		}

		// Allow coderacer.pro domain
		if strings.Contains(origin, "coderacer.pro") {
			return true
		}

		return false
	},
}

// NewWebSocketController creates a new WebSocketController instance
func NewWebSocketController(wsService service.WebSocketService, logger logger.Logger) *WebSocketController {
	return &WebSocketController{
		wsService: wsService,
		logger:    logger,
	}
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

	// Parse game ID
	gameID, err := uuid.Parse(ctx.Param("gameId"))
	if err != nil {
		c.logger.Error().Err(err).Str("gameId", ctx.Param("gameId")).Msg("Invalid game ID format")
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid game ID",
		})
		return
	}

	// Attempt to upgrade HTTP connection to WebSocket connection
	conn, err := upgrader.Upgrade(ctx.Writer, ctx.Request, nil)
	if err != nil {
		c.logger.Error().Err(err).Msg("WebSocket upgrade failed")
		return
	}

	// Handle WebSocket connection
	c.logger.Info().
		Str("userId", userID.(uuid.UUID).String()).
		Str("gameId", gameID.String()).
		Msg("WebSocket connection successful")

	c.wsService.HandleConnection(conn, userID.(uuid.UUID), gameID)
}
