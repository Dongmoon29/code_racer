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
type MatchController struct {
	matchService service.MatchService
	logger       logger.Logger
}

// NewGameController GameController 인스턴스 생성
func NewMatchController(matchService service.MatchService, logger logger.Logger) *MatchController {
	return &MatchController{
		matchService: matchService,
		logger:       logger,
	}
}

// GetMatch 매치 정보 조회 핸들러
func (c *MatchController) GetMatch(ctx *gin.Context) {
	// Parse match ID
	matchID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		BadRequest(ctx, "Invalid match ID")
		return
	}

	// Service 호출
	res, err := c.matchService.GetMatch(matchID)
	if err != nil {
		NotFound(ctx, "Match not found")
		return
	}

	OK(ctx, res)
}

// SubmitSolution 코드 제출 핸들러
func (c *MatchController) SubmitSolution(ctx *gin.Context) {
	// 사용자 ID 가져오기
	userID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	// Parse match ID
	matchID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		BadRequest(ctx, "Invalid match ID")
		return
	}

	// 요청 데이터 바인딩
	var req model.SubmitSolutionRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request: "+err.Error())
		return
	}

	// 코드 제출 및 평가
	result, err := c.matchService.SubmitSolution(matchID, userID.(uuid.UUID), &req)
	if err != nil {
		// Judge0 API 할당량 초과 에러 확인
		if strings.Contains(err.Error(), "exceeded the DAILY quota") {
			JSONError(ctx, http.StatusTooManyRequests, "Code evaluation service is currently unavailable due to daily quota exceeded. Please try again later.", "judge0_quota_exceeded")
			return
		}

		InternalError(ctx, err.Error())
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":   true,
		"is_winner": result.IsWinner,
		"message":   result.Message,
	})
}

// CreateSinglePlayerMatch creates a single player match
func (c *MatchController) CreateSinglePlayerMatch(ctx *gin.Context) {
	// 사용자 ID 가져오기
	userID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	// 요청 데이터 바인딩
	var req struct {
		Difficulty string `json:"difficulty" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request: "+err.Error())
		return
	}

	// Validate difficulty
	if req.Difficulty != "Easy" && req.Difficulty != "Medium" && req.Difficulty != "Hard" {
		BadRequest(ctx, "Invalid difficulty. Must be Easy, Medium, or Hard")
		return
	}

	// Create single player match
	match, err := c.matchService.CreateSinglePlayerMatch(userID.(uuid.UUID), req.Difficulty)
	if err != nil {
		c.logger.Error().Err(err).Msg("Failed to create single player match")
		InternalError(ctx, "Failed to create single player match")
		return
	}

	c.logger.Info().
		Str("matchID", match.ID.String()).
		Str("userID", userID.(uuid.UUID).String()).
		Str("difficulty", req.Difficulty).
		Msg("Single player match created successfully")

	OK(ctx, match.ToResponse())
}
