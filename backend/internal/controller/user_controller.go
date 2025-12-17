package controller

import (
	"fmt"
	"net/http"
	"strings"

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
		WriteError(ctx, err)
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

	// Embed recent_games into user object for response ergonomics
	enriched := *user
	enriched.RecentGames = recent
	OK(ctx, enriched)
}

func (c *UserController) GetProfile(ctx *gin.Context) {
	userID, err := uuid.Parse(ctx.Param("userId"))
	if err != nil {
		BadRequest(ctx, "Invalid user ID")
		return
	}

	user, err := c.userService.GetProfile(userID)
	if err != nil {
		WriteError(ctx, err)
		return
	}

	// Get recent games for the user
	recent := []model.RecentGameSummary{}
	if svc, ok := c.userService.(interface {
		GetRecentGames(uuid.UUID, int) ([]model.RecentGameSummary, error)
	}); ok {
		if r, err := svc.GetRecentGames(userID, 5); err == nil {
			recent = r
		}
	}

	// Convert to UserResponse and embed recent_games
	profile := user.ToResponse()
	profile.RecentGames = recent

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
		WriteError(ctx, err)
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
		parts := strings.Split(sortParam, ":")
		if len(parts) == 2 {
			orderBy = parts[0]
			dir = parts[1]
		}
	}

	search := strings.TrimSpace(ctx.Query("search")) // Search query for name, email, or ID

	c.logger.Debug().
		Str("sortParam", sortParam).
		Str("orderBy", orderBy).
		Str("dir", dir).
		Str("search", search).
		Int("page", page).
		Int("limit", limit).
		Msg("AdminListUsers: parameters")

	users, total, err := c.userService.ListUsers(page, limit, orderBy, dir, search)
	if err != nil {
		WriteError(ctx, err)
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
		WriteError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"users":   users,
	})
}
