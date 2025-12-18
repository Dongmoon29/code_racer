package controller

import (
	"strconv"

	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type CommunityController struct {
	communityService interfaces.CommunityService
	logger           logger.Logger
}

func NewCommunityController(communityService interfaces.CommunityService, logger logger.Logger) *CommunityController {
	return &CommunityController{
		communityService: communityService,
		logger:           logger,
	}
}

// CreatePost creates a new post
// POST /api/feedback
func (c *CommunityController) CreatePost(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	var req model.CreatePostRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request: "+err.Error())
		return
	}

	post, err := c.communityService.CreatePost(userID.(uuid.UUID), &req)
	if err != nil {
		WriteError(ctx, err)
		return
	}

	Created(ctx, post)
}

// GetPost gets a post by ID
// GET /api/feedback/:id
func (c *CommunityController) GetPost(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		BadRequest(ctx, "Invalid post ID")
		return
	}

	post, err := c.communityService.GetPostByID(id, userID.(uuid.UUID))
	if err != nil {
		WriteError(ctx, err)
		return
	}

	OK(ctx, post)
}

// GetUserPosts gets all posts by the current user
// GET /api/feedback/my
func (c *CommunityController) GetUserPosts(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	limit := 20
	offset := 0

	if limitStr := ctx.Query("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	if offsetStr := ctx.Query("offset"); offsetStr != "" {
		if parsed, err := strconv.Atoi(offsetStr); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	posts, total, err := c.communityService.GetUserPosts(userID.(uuid.UUID), limit, offset)
	if err != nil {
		WriteError(ctx, err)
		return
	}

	OK(ctx, gin.H{
		"items":  posts,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// ListPosts lists all posts
// GET /api/feedback
func (c *CommunityController) ListPosts(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	limit := 20
	offset := 0

	if limitStr := ctx.Query("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	if offsetStr := ctx.Query("offset"); offsetStr != "" {
		if parsed, err := strconv.Atoi(offsetStr); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	var status *model.PostStatus
	if statusStr := ctx.Query("status"); statusStr != "" {
		s := model.PostStatus(statusStr)
		status = &s
	}

	var postType *model.PostType
	if typeStr := ctx.Query("type"); typeStr != "" {
		t := model.PostType(typeStr)
		postType = &t
	}

	sort := model.PostSort(ctx.DefaultQuery("sort", string(model.PostSortHot)))
	if sort != model.PostSortHot && sort != model.PostSortNew && sort != model.PostSortTop {
		BadRequest(ctx, "Invalid sort value")
		return
	}

	posts, total, err := c.communityService.ListPosts(userID.(uuid.UUID), limit, offset, status, postType, sort)
	if err != nil {
		WriteError(ctx, err)
		return
	}

	OK(ctx, gin.H{
		"items":  posts,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// VotePost votes on a post: 1(upvote), -1(downvote), 0(remove)
// POST /api/feedback/:id/vote
func (c *CommunityController) VotePost(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		BadRequest(ctx, "Invalid post ID")
		return
	}

	var req model.VotePostRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request: "+err.Error())
		return
	}

	post, err := c.communityService.VotePost(userID.(uuid.UUID), id, req.Value)
	if err != nil {
		WriteError(ctx, err)
		return
	}

	OK(ctx, post)
}

// UpdatePostStatus updates the status of a post (admin only)
// PATCH /api/feedback/:id/status
func (c *CommunityController) UpdatePostStatus(ctx *gin.Context) {
	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		BadRequest(ctx, "Invalid post ID")
		return
	}

	var req struct {
		Status model.PostStatus `json:"status" binding:"required,oneof=pending in_progress resolved closed"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request: "+err.Error())
		return
	}

	post, err := c.communityService.UpdatePostStatus(id, req.Status)
	if err != nil {
		WriteError(ctx, err)
		return
	}

	OK(ctx, post)
}

// DeletePost deletes a post (admin only)
// DELETE /api/feedback/:id
func (c *CommunityController) DeletePost(ctx *gin.Context) {
	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		BadRequest(ctx, "Invalid post ID")
		return
	}

	if err := c.communityService.DeletePost(id); err != nil {
		WriteError(ctx, err)
		return
	}

	OK(ctx, gin.H{
		"message": "Post deleted successfully",
	})
}
