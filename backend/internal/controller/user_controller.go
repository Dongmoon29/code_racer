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

func (c *UserController) GetCurrentUser(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	uid := userID.(uuid.UUID)
	user, err := c.userService.GetUserByID(uid)
	if err != nil {
		InternalError(ctx, err.Error())
		return
	}
	recent := []model.RecentGameSummary{}
	if svc, ok := c.userService.(interface {
		GetRecentGames(uuid.UUID, int) ([]model.RecentGameSummary, error)
	}); ok {
		if r, err := svc.GetRecentGames(uid, 5); err == nil {
			recent = r
		}
	}

	OK(ctx, model.CurrentUserMeResponse{User: user, RecentGames: recent})
}

func (c *UserController) GetProfile(ctx *gin.Context) {
	userID, err := uuid.Parse(ctx.Param("userId"))
	if err != nil {
		BadRequest(ctx, "Invalid user ID")
		return
	}

	profile, err := c.userService.GetProfile(userID)
	if err != nil {
		InternalError(ctx, err.Error())
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"profile": profile,
	})
}

func (c *UserController) UpdateProfile(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	var req model.UpdateProfileRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request: "+err.Error())
		return
	}

	profile, err := c.userService.UpdateProfile(userID.(uuid.UUID), &req)
	if err != nil {
		InternalError(ctx, err.Error())
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"profile": profile,
	})
}

func (c *UserController) AdminListUsers(ctx *gin.Context) {
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

func (c *UserController) GetLeaderboard(ctx *gin.Context) {
	users, err := c.userService.GetLeaderboard(20)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"users":   users,
	})
}
