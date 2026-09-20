package controller

import (
	"net/http"

	"github.com/Dongmoon29/code_racer/internal/game"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type MatchController struct {
	matchService service.GameEngine
	logger       logger.Logger
}

func NewMatchController(matchService service.GameEngine, logger logger.Logger) *MatchController {
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
	res, err := c.matchService.Get(ctx.Request.Context(), matchID)
	if err != nil {
		c.logger.Error().
			Err(err).
			Str("matchID", matchID.String()).
			Msg("Failed to get match")
		WriteError(ctx, err)
		return
	}

	OK(ctx, res.ToResponse())
}

func (c *MatchController) GetActiveMatch(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}
	match, err := c.matchService.GetActive(ctx.Request.Context(), userID.(uuid.UUID))
	if err != nil {
		WriteError(ctx, err)
		return
	}
	if match == nil {
		OK(ctx, nil)
		return
	}
	OK(ctx, match.ToResponse())
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

	var req struct {
		Code     string `json:"code" binding:"required"`
		Language string `json:"language" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request: "+err.Error())
		return
	}

	// Code submission and evaluation
	result, err := c.matchService.Submit(ctx.Request.Context(), game.SubmitCommand{
		MatchID: matchID, UserID: userID.(uuid.UUID), Code: req.Code, Language: req.Language,
	})
	if err != nil {
		c.logger.Error().
			Err(err).
			Str("matchID", matchID.String()).
			Str("userID", userID.(uuid.UUID).String()).
			Msg("Failed to submit solution")
		WriteError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"success":   result.Success,
			"is_winner": result.IsWinner,
			"message":   result.Message,
		},
	})
}

func (c *MatchController) CloseMatch(ctx *gin.Context) {
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
	if err := c.matchService.Close(ctx.Request.Context(), game.ParticipantCommand{MatchID: matchID, UserID: userID.(uuid.UUID)}); err != nil {
		WriteError(ctx, err)
		return
	}
	OK(ctx, gin.H{"id": matchID, "status": "finished"})
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

	match, err := c.matchService.CreateSingle(ctx.Request.Context(), game.CreateSingleMatchCommand{
		PlayerID: userID.(uuid.UUID), Difficulty: model.Difficulty(req.Difficulty),
	})
	if err != nil {
		c.logger.Error().Err(err).Msg("Failed to create single player match")
		WriteError(ctx, err)
		return
	}

	c.logger.Info().
		Str("matchID", match.ID.String()).
		Str("userID", userID.(uuid.UUID).String()).
		Str("difficulty", req.Difficulty).
		Msg("Single player match created successfully")

	OK(ctx, match.ToResponse())
}
