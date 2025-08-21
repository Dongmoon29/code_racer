package router

import (
	"time"

	"github.com/Dongmoon29/code_racer/internal/config"
	"github.com/Dongmoon29/code_racer/internal/controller"
	"github.com/Dongmoon29/code_racer/internal/middleware"
	"github.com/Dongmoon29/code_racer/internal/util"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Setup initializes and returns the router with all routes configured
func Setup(
	authController *controller.AuthController,
	gameController *controller.GameController,
	userController *controller.UserController,
	wsController *controller.WebSocketController,
	authMiddleware *middleware.AuthMiddleware,
	cfg *config.Config,
) *gin.Engine {
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())

	// 헬스체크 엔드포인트
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})
	// CORS 설정 - 여러 도메인 지원
	allowedOrigins := util.GetCORSAllowedOrigins()

	// CORS 설정
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false, // 쿠키 기반 인증 제거로 false로 변경
		MaxAge:           12 * time.Hour,
	}))

	// API 라우트 그룹
	api := router.Group("/api")
	{
		// 인증 관련 라우트
		auth := api.Group("/auth")
		{
			auth.POST("/register", authController.Register)
			auth.POST("/login", authController.Login)
			auth.POST("/logout", authController.Logout)
			auth.GET("/google", authController.GoogleAuthHandler)       // Google 로그인 페이지로 리다이렉트
			auth.GET("/google/callback", authController.GoogleCallback) // Google OAuth 콜백 처리
			auth.GET("/github", authController.GitHubAuthHandler)       // GitHub 로그인 페이지로 리다이렉트
			auth.GET("/github/callback", authController.GitHubCallback) // GitHub OAuth 콜백 처리
			auth.POST("/exchange-token", authController.ExchangeToken)  // OAuth 코드를 토큰으로 교환
		}

		// 인증이 필요한 라우트
		secured := api.Group("/")
		secured.Use(authMiddleware.APIAuthRequired())
		{
			// 게임 관련 라우트
			game := secured.Group("/games")
			{
				game.GET("", gameController.ListGames)
				game.POST("", gameController.CreateGame)
				game.GET("/:id", gameController.GetGame)
				game.POST("/:id/join", gameController.JoinGame)
				game.POST("/:id/submit", gameController.SubmitSolution)
				game.POST("/:id/close", gameController.CloseGame)
			}

			// 유저 관련 라우트
			user := secured.Group("/users")
			{
				user.GET("/me", userController.GetCurrentUser)
				user.GET("/:userId/profile", userController.GetProfile)
				user.PUT("/profile", userController.UpdateProfile)
			}

			// LeetCode 문제 관련 라우트
			leetcode := secured.Group("/leetcode")
			{
				leetcode.GET("", gameController.ListLeetCodes)
				leetcode.GET("/:id", gameController.GetLeetCode)

				// Admin 권한이 필요한 라우트
				adminLeetcode := leetcode.Group("/")
				adminLeetcode.Use(authMiddleware.AdminRequired())
				{
					adminLeetcode.POST("", gameController.CreateLeetCode)
					adminLeetcode.PUT("/:id", gameController.UpdateLeetCode)
					adminLeetcode.DELETE("/:id", gameController.DeleteLeetCode)
				}
			}
		}
	}

	router.GET("/ws/:gameId", authMiddleware.WebSocketAuthRequired(), wsController.HandleWebSocket)

	return router
}
