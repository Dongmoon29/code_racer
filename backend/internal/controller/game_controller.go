package controller

import (
	"net/http"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GameController 게임 관련 컨트롤러
type GameController struct {
	gameService service.GameService
	logger      logger.Logger
}

// NewGameController GameController 인스턴스 생성
func NewGameController(gameService service.GameService, logger logger.Logger) *GameController {
	return &GameController{
		gameService: gameService,
		logger:      logger,
	}
}

// REMOVED: CreateGame - replaced by automatic matching via WebSocket

// GetGame godoc
// @Summary      Get game room information
// @Description  Retrieve information about a specific game room by ID
// @Tags         games
// @Produce      json
// @Security     Bearer
// @Param        id path string true "Game ID"
// @Success      200 {object} map[string]interface{} "Game information"
// @Failure      400 {object} map[string]interface{} "Bad request"
// @Failure      404 {object} map[string]interface{} "Game not found"
// @Router       /api/games/{id} [get]
func (c *GameController) GetGame(ctx *gin.Context) {
	// 게임 ID 파싱
	gameID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid game ID",
		})
		return
	}

	// 게임 정보 조회
	game, err := c.gameService.GetGame(gameID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"game":    game,
	})
}

// SubmitSolution 코드 제출 핸들러
func (c *GameController) SubmitSolution(ctx *gin.Context) {
	// 사용자 ID 가져오기
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	// 게임 ID 파싱
	gameID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid game ID",
		})
		return
	}

	// 요청 데이터 바인딩
	var req model.SubmitSolutionRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request: " + err.Error(),
		})
		return
	}

	// 코드 제출 및 평가
	result, err := c.gameService.SubmitSolution(gameID, userID.(uuid.UUID), &req)
	if err != nil {
		// Judge0 API 할당량 초과 에러 확인
		if strings.Contains(err.Error(), "exceeded the DAILY quota") {
			ctx.JSON(http.StatusTooManyRequests, gin.H{
				"success":    false,
				"message":    "Code evaluation service is currently unavailable due to daily quota exceeded. Please try again later.",
				"error_type": "judge0_quota_exceeded",
			})
			return
		}

		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"is_winner": result.IsWinner,
		"message":   result.Message,
	})
}

// CreateGameFromMatch creates a game from a completed match
func (c *GameController) CreateGameFromMatch(ctx *gin.Context) {
	var req struct {
		MatchID string `json:"match_id" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request format",
		})
		return
	}

	// Get user ID from context
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	// Convert to UUID
	userUUID, ok := userID.(uuid.UUID)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Invalid user ID format",
		})
		return
	}

	// Create game from match
	game, err := c.gameService.CreateGameFromMatch(req.MatchID, userUUID)
	if err != nil {
		c.logger.Error().Err(err).Str("matchID", req.MatchID).Msg("Failed to create game from match")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"game":    game,
	})
}
