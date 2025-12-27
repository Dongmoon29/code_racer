package controller

import (
	"strconv"

	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type PostCommentController struct {
	commentService interfaces.PostCommentService
	logger         logger.Logger
}

func NewPostCommentController(commentService interfaces.PostCommentService, logger logger.Logger) *PostCommentController {
	return &PostCommentController{
		commentService: commentService,
		logger:         logger,
	}
}

// CreateComment creates a new comment on a post
// POST /api/community/comments/:postId
func (c *PostCommentController) CreateComment(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	postID, err := uuid.Parse(ctx.Param("postId"))
	if err != nil {
		BadRequest(ctx, "Invalid post ID")
		return
	}

	var req model.CreatePostCommentRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request: "+err.Error())
		return
	}

	comment, err := c.commentService.CreateComment(userID.(uuid.UUID), postID, &req)
	if err != nil {
		WriteError(ctx, err)
		return
	}

	Created(ctx, comment)
}

// GetComments gets all comments for a post
// GET /api/community/comments/:postId
func (c *PostCommentController) GetComments(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	postID, err := uuid.Parse(ctx.Param("postId"))
	if err != nil {
		BadRequest(ctx, "Invalid post ID")
		return
	}

	// Check if we should return comments with replies (hierarchical structure)
	if ctx.Query("withReplies") == "true" {
		comments, err := c.commentService.GetCommentsByPostIDWithReplies(postID, userID.(uuid.UUID))
		if err != nil {
			WriteError(ctx, err)
			return
		}

		OK(ctx, gin.H{
			"items": comments,
		})
		return
	}

	limit := 50
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

	comments, total, err := c.commentService.GetCommentsByPostID(postID, limit, offset)
	if err != nil {
		WriteError(ctx, err)
		return
	}

	OK(ctx, gin.H{
		"items":  comments,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// VoteComment votes on a comment: 1(upvote), -1(downvote), 0(remove)
// POST /api/community/comments/vote/:id
func (c *PostCommentController) VoteComment(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	commentID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		BadRequest(ctx, "Invalid comment ID")
		return
	}

	var req model.VotePostCommentRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request: "+err.Error())
		return
	}

	updated, err := c.commentService.VoteComment(userID.(uuid.UUID), commentID, req.Value)
	if err != nil {
		WriteError(ctx, err)
		return
	}

	OK(ctx, updated)
}

// UpdateComment updates a comment
// PUT /api/community/comments/:id
func (c *PostCommentController) UpdateComment(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		BadRequest(ctx, "Invalid comment ID")
		return
	}

	var req struct {
		Content string `json:"content" binding:"required,min=1"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request: "+err.Error())
		return
	}

	comment, err := c.commentService.UpdateComment(id, userID.(uuid.UUID), req.Content)
	if err != nil {
		WriteError(ctx, err)
		return
	}

	OK(ctx, comment)
}

// DeleteComment deletes a comment
// DELETE /api/community/comments/:id
func (c *PostCommentController) DeleteComment(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		Unauthorized(ctx, "User not authenticated")
		return
	}

	id, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		BadRequest(ctx, "Invalid comment ID")
		return
	}

	if err := c.commentService.DeleteComment(id, userID.(uuid.UUID)); err != nil {
		WriteError(ctx, err)
		return
	}

	OK(ctx, gin.H{
		"message": "Comment deleted successfully",
	})
}
