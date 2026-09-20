package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestAdminRequiredAllowsAdminRole(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	middleware := &AuthMiddleware{}
	router.GET("/admin", func(ctx *gin.Context) {
		ctx.Set("userRole", "admin")
	}, middleware.AdminRequired(), func(ctx *gin.Context) {
		ctx.Status(http.StatusNoContent)
	})

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/admin", nil))

	assert.Equal(t, http.StatusNoContent, recorder.Code)
}

func TestAdminRequiredRejectsUserRole(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	middleware := &AuthMiddleware{}
	router.GET("/admin", func(ctx *gin.Context) {
		ctx.Set("userRole", "user")
	}, middleware.AdminRequired(), func(ctx *gin.Context) {
		ctx.Status(http.StatusNoContent)
	})

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/admin", nil))

	assert.Equal(t, http.StatusForbidden, recorder.Code)
}
