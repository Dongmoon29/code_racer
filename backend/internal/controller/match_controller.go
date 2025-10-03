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
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid match ID",
		})
		return
	}

	// Service 호출
	res, err := c.matchService.GetMatch(matchID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Match not found",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"success": true, "data": res})
}

// SubmitSolution 코드 제출 핸들러
func (c *MatchController) SubmitSolution(ctx *gin.Context) {
	// 사용자 ID 가져오기
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	// Parse match ID
	matchID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid match ID",
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
	result, err := c.matchService.SubmitSolution(matchID, userID.(uuid.UUID), &req)
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
