package controller

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type LeetCodeController struct {
	leetCodeService service.LeetCodeService
	logger          logger.Logger
}

func NewLeetCodeController(leetCodeService service.LeetCodeService, logger logger.Logger) *LeetCodeController {
	return &LeetCodeController{
		leetCodeService: leetCodeService,
		logger:          logger,
	}
}

// GetAllProblems godoc
// @Summary      Get all LeetCode problems
// @Description  Retrieve all LeetCode problems registered in the system
// @Tags         leetcode
// @Produce      json
// @Security     Bearer
// @Success      200 {object} map[string]interface{} "List of problems"
// @Failure      500 {object} map[string]interface{} "Server error"
// @Router       /api/leetcode [get]
func (c *LeetCodeController) GetAllProblems(ctx *gin.Context) {
	problems, err := c.leetCodeService.GetAllProblems()
	if err != nil {
		c.logger.Error().Err(err).Msg("Failed to get all problems")
		InternalError(ctx, "Failed to fetch problems")
		return
	}

	OK(ctx, problems)
}

// GetProblemByID godoc
// @Summary      Get specific LeetCode problem
// @Description  Retrieve detailed information about a specific LeetCode problem by ID
// @Tags         leetcode
// @Produce      json
// @Security     Bearer
// @Param        id path string true "Problem ID"
// @Success      200 {object} map[string]interface{} "Problem details"
// @Failure      400 {object} map[string]interface{} "Bad request"
// @Failure      404 {object} map[string]interface{} "Problem not found"
// @Router       /api/leetcode/{id} [get]
func (c *LeetCodeController) GetProblemByID(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		BadRequest(ctx, "Invalid problem ID")
		return
	}

	problem, err := c.leetCodeService.GetProblemByID(id)
	if err != nil {
		c.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to get problem by ID")
		NotFound(ctx, "Problem not found")
		return
	}

	OK(ctx, problem)
}

func (c *LeetCodeController) CreateProblem(ctx *gin.Context) {
	var req model.CreateLeetCodeRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request data: "+err.Error())
		return
	}

	if !isValidDifficulty(req.Difficulty) {
		BadRequest(ctx, "Invalid difficulty level. Must be one of: Easy, Medium, Hard")
		return
	}

	problem, err := c.leetCodeService.CreateProblem(&req)
	if err != nil {
		c.logger.Error().Err(err).Str("title", req.Title).Msg("Failed to create problem")
		InternalError(ctx, err.Error())
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    problem,
		"message": "Problem created successfully",
	})
}

func (c *LeetCodeController) UpdateProblem(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid problem ID",
		})
		return
	}

	var req model.UpdateLeetCodeRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request data: "+err.Error())
		return
	}

	if !isValidDifficulty(req.Difficulty) {
		BadRequest(ctx, "Invalid difficulty level. Must be one of: Easy, Medium, Hard")
		return
	}

	problem, err := c.leetCodeService.UpdateProblem(id, &req)
	if err != nil {
		c.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to update problem")
		if strings.Contains(err.Error(), "not found") {
			NotFound(ctx, "Problem not found")
		} else {
			InternalError(ctx, err.Error())
		}
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    problem,
		"message": "Problem updated successfully",
	})
}

func (c *LeetCodeController) DeleteProblem(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		BadRequest(ctx, "Invalid problem ID")
		return
	}

	err = c.leetCodeService.DeleteProblem(id)
	if err != nil {
		c.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to delete problem")
		if strings.Contains(err.Error(), "not found") {
			NotFound(ctx, "Problem not found")
		} else {
			InternalError(ctx, err.Error())
		}
		return
	}

	JSONMessage(ctx, http.StatusOK, "Problem deleted successfully")
}

func (c *LeetCodeController) GetProblemsByDifficulty(ctx *gin.Context) {
	difficulty := ctx.Query("difficulty")
	if difficulty == "" {
		BadRequest(ctx, "Difficulty parameter is required")
		return
	}

	if !isValidDifficulty(difficulty) {
		BadRequest(ctx, "Invalid difficulty level. Must be one of: Easy, Medium, Hard")
		return
	}

	problems, err := c.leetCodeService.GetProblemsByDifficulty(difficulty)
	if err != nil {
		c.logger.Error().Err(err).Str("difficulty", difficulty).Msg("Failed to get problems by difficulty")
		InternalError(ctx, "Failed to fetch problems")
		return
	}

	OK(ctx, problems)
}

func (c *LeetCodeController) SearchProblems(ctx *gin.Context) {
	query := ctx.Query("q")
	if query == "" {
		BadRequest(ctx, "Search query parameter 'q' is required")
		return
	}

	if len(query) < 2 {
		BadRequest(ctx, "Search query must be at least 2 characters long")
		return
	}

	problems, err := c.leetCodeService.SearchProblems(query)
	if err != nil {
		c.logger.Error().Err(err).Str("query", query).Msg("Failed to search problems")
		InternalError(ctx, "Failed to search problems")
		return
	}

	OK(ctx, problems)
}

func (c *LeetCodeController) GetProblemsWithPagination(ctx *gin.Context) {
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
	problems, err := c.leetCodeService.GetAllProblems()
	if err != nil {
		c.logger.Error().Err(err).Msg("Failed to get problems with pagination")
		InternalError(ctx, "Failed to fetch problems")
		return
	}

	// 간단한 페이지네이션 (실제로는 데이터베이스 레벨에서 처리해야 함)
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

// isValidDifficulty 난이도 값이 유효한지 확인
func isValidDifficulty(difficulty string) bool {
	validDifficulties := []string{"Easy", "Medium", "Hard"}
	for _, valid := range validDifficulties {
		if difficulty == valid {
			return true
		}
	}
	return false
}
