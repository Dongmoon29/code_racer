package controller

import (
	"net/http"
	"strconv"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProblemController struct {
	problemService service.ProblemService
	logger         logger.Logger
}

func NewProblemController(problemService service.ProblemService, logger logger.Logger) *ProblemController {
	return &ProblemController{
		problemService: problemService,
		logger:         logger,
	}
}

func (c *ProblemController) GetAllProblems(ctx *gin.Context) {
	problems, err := c.problemService.GetAllProblems()
	if err != nil {
		c.logger.Error().Err(err).Msg("Failed to get all problems")
		InternalError(ctx, "Failed to fetch problems")
		return
	}

	OK(ctx, problems)
}

func (c *ProblemController) GetProblemByID(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.logger.Error().Err(err).Str("idStr", idStr).Msg("Failed to parse problem ID")
		BadRequest(ctx, "Invalid problem ID")
		return
	}

	c.logger.Debug().Str("problemID", id.String()).Msg("Getting problem by ID")

	problem, err := c.problemService.GetProblemByID(id)
	if err != nil {
		c.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to get problem by ID")
		WriteError(ctx, err)
		return
	}
	// Hidden judge cases are visible only in the admin problem editor.
	if role, _ := ctx.Get("userRole"); role != "admin" && problem != nil {
		problem.TestCases = []model.TestCase{}
	}

	c.logger.Debug().Str("problemID", id.String()).Msg("Problem loaded successfully")

	OK(ctx, problem)
}

func (c *ProblemController) CreateProblem(ctx *gin.Context) {
	var req model.CreateProblemRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request data: "+err.Error())
		return
	}

	if !model.Difficulty(req.Difficulty).IsValid() {
		BadRequest(ctx, "Invalid difficulty level. Must be one of: Easy, Medium, Hard")
		return
	}

	problem, err := c.problemService.CreateProblem(&req)
	if err != nil {
		c.logger.Error().Err(err).Str("title", req.Title).Msg("Failed to create problem")
		WriteError(ctx, err)
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    problem,
		"message": "Problem created successfully",
	})
}

func (c *ProblemController) UpdateProblem(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid problem ID",
		})
		return
	}

	var req model.UpdateProblemRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request data: "+err.Error())
		return
	}

	if !model.Difficulty(req.Difficulty).IsValid() {
		BadRequest(ctx, "Invalid difficulty level. Must be one of: Easy, Medium, Hard")
		return
	}

	problem, err := c.problemService.UpdateProblem(id, &req)
	if err != nil {
		c.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to update problem")
		WriteError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    problem,
		"message": "Problem updated successfully",
	})
}

func (c *ProblemController) DeleteProblem(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		BadRequest(ctx, "Invalid problem ID")
		return
	}

	err = c.problemService.DeleteProblem(id)
	if err != nil {
		c.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to delete problem")
		WriteError(ctx, err)
		return
	}

	JSONMessage(ctx, http.StatusOK, "Problem deleted successfully")
}

func (c *ProblemController) GetProblemsByDifficulty(ctx *gin.Context) {
	difficulty := ctx.Query("difficulty")
	if difficulty == "" {
		BadRequest(ctx, "Difficulty parameter is required")
		return
	}

	if !model.Difficulty(difficulty).IsValid() {
		BadRequest(ctx, "Invalid difficulty level. Must be one of: Easy, Medium, Hard")
		return
	}

	problems, err := c.problemService.GetProblemsByDifficulty(difficulty)
	if err != nil {
		c.logger.Error().Err(err).Str("difficulty", difficulty).Msg("Failed to get problems by difficulty")
		InternalError(ctx, "Failed to fetch problems")
		return
	}

	OK(ctx, problems)
}

func (c *ProblemController) SearchProblems(ctx *gin.Context) {
	query := ctx.Query("q")
	if query == "" {
		BadRequest(ctx, "Search query parameter 'q' is required")
		return
	}

	if len(query) < 2 {
		BadRequest(ctx, "Search query must be at least 2 characters long")
		return
	}

	problems, err := c.problemService.SearchProblems(query)
	if err != nil {
		c.logger.Error().Err(err).Str("query", query).Msg("Failed to search problems")
		InternalError(ctx, "Failed to search problems")
		return
	}

	OK(ctx, problems)
}

func (c *ProblemController) GetProblemsWithPagination(ctx *gin.Context) {
	pageStr := ctx.DefaultQuery("page", "1")
	limitStr := ctx.DefaultQuery("limit", "10")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 || limit > 100 {
		limit = 10
	}

	problems, total, err := c.problemService.GetProblemsPage(page, limit)
	if err != nil {
		c.logger.Error().Err(err).Msg("Failed to get problems with pagination")
		InternalError(ctx, "Failed to fetch problems")
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    problems,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}
