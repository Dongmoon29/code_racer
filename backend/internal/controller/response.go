package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data,omitempty"`
	Message   string      `json:"message,omitempty"`
	ErrorCode string      `json:"error_code,omitempty"`
}

func JSONSuccess(ctx *gin.Context, status int, data interface{}) {
	ctx.JSON(status, APIResponse{Success: true, Data: data})
}

func JSONMessage(ctx *gin.Context, status int, message string) {
	ctx.JSON(status, APIResponse{Success: true, Message: message})
}

func JSONError(ctx *gin.Context, status int, message string, code string) {
	ctx.JSON(status, APIResponse{Success: false, Message: message, ErrorCode: code})
}

// Shorthands
func OK(ctx *gin.Context, data interface{})      { JSONSuccess(ctx, http.StatusOK, data) }
func Created(ctx *gin.Context, data interface{}) { JSONSuccess(ctx, http.StatusCreated, data) }
func BadRequest(ctx *gin.Context, message string) {
	JSONError(ctx, http.StatusBadRequest, message, "bad_request")
}
func Unauthorized(ctx *gin.Context, message string) {
	JSONError(ctx, http.StatusUnauthorized, message, "unauthorized")
}
func NotFound(ctx *gin.Context, message string) {
	JSONError(ctx, http.StatusNotFound, message, "not_found")
}
func InternalError(ctx *gin.Context, message string) {
	JSONError(ctx, http.StatusInternalServerError, message, "internal_error")
}
