package controller

import (
	"fmt"
	"net/http"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserController struct {
	userService service.UserService
	logger      logger.Logger
}

func NewUserController(userService service.UserService, logger logger.Logger) *UserController {
	return &UserController{
		userService: userService,
		logger:      logger,
	}
}

// GetCurrentUser 현재 로그인된 사용자 정보 조회
func (c *UserController) GetCurrentUser(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	user, err := c.userService.GetUserByID(userID.(uuid.UUID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"user":    user,
	})
}

// GetProfile 사용자 프로필 조회
func (c *UserController) GetProfile(ctx *gin.Context) {
	userID, err := uuid.Parse(ctx.Param("userId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid user ID",
		})
		return
	}

	profile, err := c.userService.GetProfile(userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"profile": profile,
	})
}

// UpdateProfile 사용자 프로필 업데이트
func (c *UserController) UpdateProfile(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "User not authenticated",
		})
		return
	}

	var req model.UpdateProfileRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request: " + err.Error(),
		})
		return
	}

	profile, err := c.userService.UpdateProfile(userID.(uuid.UUID), &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"profile": profile,
	})
}

// AdminListUsers 관리자가 사용자 목록을 페이지네이션으로 조회
func (c *UserController) AdminListUsers(ctx *gin.Context) {
	// AdminRequired 미들웨어에서 권한 체크됨
	page := 1
	limit := 20
	if p := ctx.Query("page"); p != "" {
		if _, err := fmt.Sscanf(p, "%d", &page); err != nil {
			page = 1
		}
	}
	if l := ctx.Query("limit"); l != "" {
		if _, err := fmt.Sscanf(l, "%d", &limit); err != nil {
			limit = 20
		}
	}

	sortParam := ctx.Query("sort") // e.g., "created_at:desc"
	orderBy := "created_at"
	dir := "desc"
	if sortParam != "" {
		var f, d string
		if _, err := fmt.Sscanf(sortParam, "%[^:]:%s", &f, &d); err == nil {
			orderBy = f
			dir = d
		}
	}

	users, total, err := c.userService.ListUsers(page, limit, orderBy, dir)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	hasNext := int64(page*limit) < total
	ctx.JSON(http.StatusOK, gin.H{
		"success":  true,
		"items":    users,
		"page":     page,
		"limit":    limit,
		"total":    total,
		"has_next": hasNext,
	})
}
