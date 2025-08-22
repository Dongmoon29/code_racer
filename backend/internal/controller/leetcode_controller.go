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

// GetAllProblems 모든 LeetCode 문제 목록 조회
func (c *LeetCodeController) GetAllProblems(ctx *gin.Context) {
	problems, err := c.leetCodeService.GetAllProblems()
	if err != nil {
		c.logger.Error().Err(err).Msg("Failed to get all problems")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch problems",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    problems,
	})
}

// GetProblemByID 특정 LeetCode 문제 조회
func (c *LeetCodeController) GetProblemByID(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid problem ID",
		})
		return
	}

	problem, err := c.leetCodeService.GetProblemByID(id)
	if err != nil {
		c.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to get problem by ID")
		ctx.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Problem not found",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    problem,
	})
}

// CreateProblem 새로운 LeetCode 문제 생성
func (c *LeetCodeController) CreateProblem(ctx *gin.Context) {
	var req model.CreateLeetCodeRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data: " + err.Error(),
		})
		return
	}

	// 난이도 유효성 검사
	if !isValidDifficulty(req.Difficulty) {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid difficulty level. Must be one of: Easy, Medium, Hard",
		})
		return
	}

	problem, err := c.leetCodeService.CreateProblem(&req)
	if err != nil {
		c.logger.Error().Err(err).Str("title", req.Title).Msg("Failed to create problem")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success": true,
		"data":    problem,
		"message": "Problem created successfully",
	})
}

// UpdateProblem LeetCode 문제 수정
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
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request data: " + err.Error(),
		})
		return
	}

	// 난이도 유효성 검사
	if !isValidDifficulty(req.Difficulty) {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid difficulty level. Must be one of: Easy, Medium, Hard",
		})
		return
	}

	problem, err := c.leetCodeService.UpdateProblem(id, &req)
	if err != nil {
		c.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to update problem")
		if strings.Contains(err.Error(), "not found") {
			ctx.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Problem not found",
			})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": err.Error(),
			})
		}
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    problem,
		"message": "Problem updated successfully",
	})
}

// DeleteProblem LeetCode 문제 삭제
func (c *LeetCodeController) DeleteProblem(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid problem ID",
		})
		return
	}

	err = c.leetCodeService.DeleteProblem(id)
	if err != nil {
		c.logger.Error().Err(err).Str("problemID", id.String()).Msg("Failed to delete problem")
		if strings.Contains(err.Error(), "not found") {
			ctx.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "Problem not found",
			})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": err.Error(),
			})
		}
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Problem deleted successfully",
	})
}

// GetProblemsByDifficulty 난이도별 문제 조회
func (c *LeetCodeController) GetProblemsByDifficulty(ctx *gin.Context) {
	difficulty := ctx.Query("difficulty")
	if difficulty == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Difficulty parameter is required",
		})
		return
	}

	if !isValidDifficulty(difficulty) {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid difficulty level. Must be one of: Easy, Medium, Hard",
		})
		return
	}

	problems, err := c.leetCodeService.GetProblemsByDifficulty(difficulty)
	if err != nil {
		c.logger.Error().Err(err).Str("difficulty", difficulty).Msg("Failed to get problems by difficulty")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch problems",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    problems,
	})
}

// SearchProblems 문제 검색
func (c *LeetCodeController) SearchProblems(ctx *gin.Context) {
	query := ctx.Query("q")
	if query == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Search query parameter 'q' is required",
		})
		return
	}

	// 검색어 길이 제한
	if len(query) < 2 {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Search query must be at least 2 characters long",
		})
		return
	}

	problems, err := c.leetCodeService.SearchProblems(query)
	if err != nil {
		c.logger.Error().Err(err).Str("query", query).Msg("Failed to search problems")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to search problems",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    problems,
	})
}

// GetProblemsWithPagination 페이지네이션을 포함한 문제 목록 조회
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

	// TODO: 리포지토리에 페이지네이션 메서드 추가 필요
	problems, err := c.leetCodeService.GetAllProblems()
	if err != nil {
		c.logger.Error().Err(err).Msg("Failed to get problems with pagination")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch problems",
		})
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
