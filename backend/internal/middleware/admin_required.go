package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (m *AuthMiddleware) AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("userRole")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Authentication required",
			})
			c.Abort()
			return
		}

		// check admin role
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
