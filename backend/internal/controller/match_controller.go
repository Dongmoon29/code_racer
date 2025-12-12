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

type MatchController struct {
	matchService service.MatchService
	logger       logger.Logger
}

func NewMatchController(matchService service.MatchService, logger logger.Logger) *MatchController {
	return &MatchController{
		matchService: matchService,
		logger:       logger,
	}
}

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
		c.logger.Error().
			Err(err).
			Str("matchID", matchID.String()).
			Msg("Failed to get match")
		NotFound(ctx, "Match not found")
		return
	}

	OK(ctx, res)
}

func (c *MatchController) SubmitSolution(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	matchID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		BadRequest(ctx, "Invalid match ID")
		return
	}

	var req model.SubmitSolutionRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request: "+err.Error())
		return
	}

	// Code submission and evaluation
	result, err := c.matchService.SubmitSolution(matchID, userID.(uuid.UUID), &req)
	if err != nil {
		c.logger.Error().
			Err(err).
			Str("matchID", matchID.String()).
			Str("userID", userID.(uuid.UUID).String()).
			Msg("Failed to submit solution")

		if strings.Contains(err.Error(), "exceeded the DAILY quota") {
			JSONError(ctx, http.StatusTooManyRequests, "Code evaluation service is currently unavailable due to daily quota exceeded. Please try again later.", "judge0_quota_exceeded")
			return
		}

		// Don't expose internal error details to users
		InternalError(ctx, "Failed to submit solution")
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
	userID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	var req struct {
		Difficulty string `json:"difficulty" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request: "+err.Error())
		return
	}

	if req.Difficulty != "Easy" && req.Difficulty != "Medium" && req.Difficulty != "Hard" {
		BadRequest(ctx, "Invalid difficulty. Must be Easy, Medium, or Hard")
		return
	}

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
