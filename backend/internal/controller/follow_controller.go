package controller

import (
	"net/http"
	"strconv"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type FollowController struct {
	followService service.FollowService
	logger        logger.Logger
}

func NewFollowController(followService service.FollowService, logger logger.Logger) *FollowController {
	return &FollowController{
		followService: followService,
		logger:        logger,
	}
}

// Follow creates a follow relationship
// POST /users/:userId/follow
func (c *FollowController) Follow(ctx *gin.Context) {
	// Get current user ID from context
	currentUserID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	// Get target user ID from URL
	targetUserID, err := uuid.Parse(ctx.Param("userId"))
	if err != nil {
		BadRequest(ctx, "Invalid user ID")
		return
	}

	// Follow the user
	err = c.followService.Follow(currentUserID.(uuid.UUID), targetUserID)
	if err != nil {
		WriteError(ctx, err)
		return
	}

	OK(ctx, gin.H{
		"message": "Successfully followed user",
	})
}

// Unfollow removes a follow relationship
// DELETE /users/:userId/follow
func (c *FollowController) Unfollow(ctx *gin.Context) {
	// Get current user ID from context
	currentUserID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	// Get target user ID from URL
	targetUserID, err := uuid.Parse(ctx.Param("userId"))
	if err != nil {
		BadRequest(ctx, "Invalid user ID")
		return
	}

	// Unfollow the user
	err = c.followService.Unfollow(currentUserID.(uuid.UUID), targetUserID)
	if err != nil {
		WriteError(ctx, err)
		return
	}

	OK(ctx, gin.H{
		"message": "Successfully unfollowed user",
	})
}

// GetFollowStats returns follower/following counts
// GET /users/:userId/follow/stats
func (c *FollowController) GetFollowStats(ctx *gin.Context) {
	userID, err := uuid.Parse(ctx.Param("userId"))
	if err != nil {
		BadRequest(ctx, "Invalid user ID")
		return
	}

	// Get current user ID if authenticated (optional)
	var currentUserID *uuid.UUID
	if userIDFromCtx, exists := ctx.Get("userID"); exists {
		uid := userIDFromCtx.(uuid.UUID)
		currentUserID = &uid
	}

	stats, err := c.followService.GetFollowStats(userID, currentUserID)
	if err != nil {
		WriteError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"stats":   stats,
	})
}

// GetFollowers returns list of users following the given user
// GET /users/:userId/followers
func (c *FollowController) GetFollowers(ctx *gin.Context) {
	userID, err := uuid.Parse(ctx.Param("userId"))
	if err != nil {
		BadRequest(ctx, "Invalid user ID")
		return
	}

	limit := 20
	offset := 0

	if l := ctx.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	if p := ctx.Query("page"); p != "" {
		if parsedPage, err := strconv.Atoi(p); err == nil && parsedPage > 0 {
			offset = (parsedPage - 1) * limit
		}
	}

	users, total, err := c.followService.GetFollowers(userID, limit, offset)
	if err != nil {
		WriteError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"items":   users,
		"total":   total,
		"page":    offset/limit + 1,
		"limit":   limit,
	})
}

// GetFollowing returns list of users the given user is following
// GET /users/:userId/following
func (c *FollowController) GetFollowing(ctx *gin.Context) {
	userID, err := uuid.Parse(ctx.Param("userId"))
	if err != nil {
		BadRequest(ctx, "Invalid user ID")
		return
	}

	limit := 20
	offset := 0

	if l := ctx.Query("limit"); l != "" {
		if parsedLimit, err := strconv.Atoi(l); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	if p := ctx.Query("page"); p != "" {
		if parsedPage, err := strconv.Atoi(p); err == nil && parsedPage > 0 {
			offset = (parsedPage - 1) * limit
		}
	}

	users, total, err := c.followService.GetFollowing(userID, limit, offset)
	if err != nil {
		WriteError(ctx, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"items":   users,
		"total":   total,
		"page":    offset/limit + 1,
		"limit":   limit,
	})
}
