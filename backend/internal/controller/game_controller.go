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

// CreateGame 게임 방 생성 핸들러
func (c *GameController) CreateGame(ctx *gin.Context) {
	// 사용자 ID 가져오기
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	// 요청 데이터 바인딩
	var req model.CreateGameRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request: " + err.Error(),
		})
		return
	}

	// 게임 방 생성
	game, err := c.gameService.CreateGame(userID.(uuid.UUID), &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success": true,
		"game":    game,
	})
}

// GetGame 게임 방 정보 조회 핸들러
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

// ListGames 게임 방 목록 조회 핸들러
func (c *GameController) ListGames(ctx *gin.Context) {
	// 게임 방 목록 조회
	games, err := c.gameService.ListGames()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"games":   games,
	})
}

// ListLeetCodes LeetCode 문제 목록 조회 핸들러
func (c *GameController) ListLeetCodes(ctx *gin.Context) {
	// LeetCode 문제 목록 조회
	leetcodes, err := c.gameService.ListLeetCodes()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"leetcodes": leetcodes,
	})
}

// JoinGame 게임 방 참가 핸들러
func (c *GameController) JoinGame(ctx *gin.Context) {
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

	// 게임 방 참가
	game, err := c.gameService.JoinGame(gameID, userID.(uuid.UUID))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
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

// CloseGame 게임 방 닫기 핸들러
func (c *GameController) CloseGame(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	gameID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid game ID",
		})
		return
	}

	if err := c.gameService.CloseGame(gameID, userID.(uuid.UUID)); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Game closed successfully",
	})
}

// GameController에 메서드 추가
func (c *GameController) CreateLeetCode(ctx *gin.Context) {
	var req model.CreateLeetCodeRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request: " + err.Error(),
		})
		return
	}

	leetcode, err := c.gameService.CreateLeetCode(&req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success":  true,
		"leetcode": leetcode,
	})
}

func (c *GameController) UpdateLeetCode(ctx *gin.Context) {
	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid ID format",
		})
		return
	}

	var req model.UpdateLeetCodeRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request: " + err.Error(),
		})
		return
	}

	leetcode, err := c.gameService.UpdateLeetCode(id, &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":  true,
		"leetcode": leetcode,
	})
}

func (c *GameController) DeleteLeetCode(ctx *gin.Context) {
	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid ID format",
		})
		return
	}

	if err := c.gameService.DeleteLeetCode(id); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Successfully deleted",
	})
}

func (c *GameController) GetLeetCode(ctx *gin.Context) {
	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	leetcode, err := c.gameService.GetLeetCode(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, leetcode)
}
