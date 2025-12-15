package controller

import (
	"net/http"

	"github.com/Dongmoon29/code_racer/internal/apperr"
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

// WriteError standardizes error -> HTTP response mapping across controllers.
// It supports typed application errors (apperr.Error) and falls back to 500.
func WriteError(ctx *gin.Context, err error) {
	if err == nil {
		InternalError(ctx, "Internal server error")
		return
	}

	if ae, ok := apperr.As(err); ok {
		switch ae.Code {
		case apperr.CodeBadRequest:
			JSONError(ctx, http.StatusBadRequest, ae.PublicMessage, string(ae.Code))
		case apperr.CodeUnauthorized:
			JSONError(ctx, http.StatusUnauthorized, ae.PublicMessage, string(ae.Code))
		case apperr.CodeForbidden:
			JSONError(ctx, http.StatusForbidden, ae.PublicMessage, string(ae.Code))
		case apperr.CodeNotFound:
			JSONError(ctx, http.StatusNotFound, ae.PublicMessage, string(ae.Code))
		case apperr.CodeConflict:
			JSONError(ctx, http.StatusConflict, ae.PublicMessage, string(ae.Code))
		case apperr.CodeQuotaExceeded:
			JSONError(ctx, http.StatusTooManyRequests, ae.PublicMessage, string(ae.Code))
		case apperr.CodeUpstreamUnavailable:
			JSONError(ctx, http.StatusServiceUnavailable, ae.PublicMessage, string(ae.Code))
		default:
			// Do not leak internal details by default.
			JSONError(ctx, http.StatusInternalServerError, "Internal server error", string(apperr.CodeInternal))
		}
		return
	}

	JSONError(ctx, http.StatusInternalServerError, "Internal server error", string(apperr.CodeInternal))
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
