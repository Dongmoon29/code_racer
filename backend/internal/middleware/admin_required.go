package middleware

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

// AdminRequired admin 권한이 필요한 라우트에 대한 미들웨어
func (m *AuthMiddleware) AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		// userRole은 이미 APIAuthRequired 미들웨어에서 설정되었다고 가정
		userRole, exists := c.Get("userRole")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authentication required",
			})
			c.Abort()
			return
		}

		// admin 권한 체크
		if userRole != "admin" {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Admin privileges required",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
