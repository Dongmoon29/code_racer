package controller

import (
	"encoding/json"
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

// logJSON logs any struct as JSON for debugging
func (c *ProblemController) logJSON(data interface{}, msg string) {
	if jsonData, err := json.MarshalIndent(data, "", "  "); err != nil {
		c.logger.Error().Err(err).Msg("Failed to marshal data to JSON")
	} else {
		c.logger.Debug().RawJSON("data", jsonData).Msg(msg)
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

	// Log problem data as JSON for easy debugging
	if problem != nil {
		c.logJSON(problem, "Problem data loaded successfully")
	} else {
		c.logger.Warn().Str("problemID", id.String()).Msg("Problem is nil")
	}

	OK(ctx, problem)
}

func (c *ProblemController) CreateProblem(ctx *gin.Context) {
	var req model.CreateProblemRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request data: "+err.Error())
		return
	}

	if !isValidDifficulty(req.Difficulty) {
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

	if !isValidDifficulty(req.Difficulty) {
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

	if !isValidDifficulty(difficulty) {
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

	// Note: Currently using in-memory pagination for simplicity
	// In production, pagination should be implemented at the database level
	// for better performance with large datasets
	problems, err := c.problemService.GetAllProblems()
	if err != nil {
		c.logger.Error().Err(err).Msg("Failed to get problems with pagination")
		InternalError(ctx, "Failed to fetch problems")
		return
	}

	// Simple pagination (should be handled at database level in practice)
	total := len(problems)
	start := (page - 1) * limit
	end := start + limit

	if start >= total {
		ctx.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    []interface{}{},
			"pagination": gin.H{
				"page":       page,
				"limit":      limit,
				"total":      total,
				"totalPages": (total + limit - 1) / limit,
			},
		})
		return
	}

	if end > total {
		end = total
	}

	paginatedProblems := problems[start:end]

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    paginatedProblems,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": (total + limit - 1) / limit,
		},
	})
}

// isValidDifficulty checks if the difficulty value is valid
func isValidDifficulty(difficulty string) bool {
	validDifficulties := []string{"Easy", "Medium", "Hard"}
	for _, valid := range validDifficulties {
		if difficulty == valid {
			return true
		}
	}
	return false
}
