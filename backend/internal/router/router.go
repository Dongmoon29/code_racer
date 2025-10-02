package router

import (
	"net/http"
	"time"

	_ "github.com/Dongmoon29/code_racer/docs"
	"github.com/Dongmoon29/code_racer/internal/config"
	"github.com/Dongmoon29/code_racer/internal/controller"
	"github.com/Dongmoon29/code_racer/internal/middleware"
	"github.com/Dongmoon29/code_racer/internal/util"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// Setup initializes and returns the router with all routes configured
func Setup(
	authController *controller.AuthController,
	gameController *controller.GameController,
	userController *controller.UserController,
	leetcodeController *controller.LeetCodeController,
	wsController *controller.WebSocketController,
	authMiddleware *middleware.AuthMiddleware,
	cfg *config.Config,
) *gin.Engine {
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())

	// health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	// Swagger documentation - 개발 환경에서만 활성화
	if !util.IsProduction() {
		router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	}

	// CORS config
	allowedOrigins := util.GetCORSAllowedOrigins()
	allowedMethods := []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete, http.MethodOptions}
	allowedHeaders := []string{"Origin", "Content-Type", "Accept", "Authorization"}
	exposeHeaders := []string{"Content-Length"}
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     allowedMethods,
		AllowHeaders:     allowedHeaders,
		ExposeHeaders:    exposeHeaders,
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))

	api := router.Group("/api")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authController.Register)
			auth.POST("/login", authController.Login)
			auth.POST("/logout", authController.Logout)

			// OAuth routes
			auth.GET("/google", authController.GoogleAuthHandler)
			auth.GET("/google/callback", authController.GoogleCallback)
			auth.GET("/github", authController.GitHubAuthHandler)
			auth.GET("/github/callback", authController.GitHubCallback)
			auth.POST("/exchange-token", authController.ExchangeToken)
		}

		// secured routes
		secured := api.Group("/")
		secured.Use(authMiddleware.APIAuthRequired())
		{
			game := secured.Group("/games")
			{
				game.GET("/:id", gameController.GetGame)
				game.POST("/:id/submit", gameController.SubmitSolution)
				game.POST("/create-from-match", gameController.CreateGameFromMatch)
			}

			// users
			user := secured.Group("/users")
			{
				user.GET("/me", userController.GetCurrentUser)
				user.GET("/:userId/profile", userController.GetProfile)
				user.PUT("/profile", userController.UpdateProfile)
			}

			// admin users
			admin := secured.Group("/admin")
			admin.Use(authMiddleware.AdminRequired())
			{
				admin.GET("/users", userController.AdminListUsers)
			}

			// leetcode
			leetcode := secured.Group("/leetcode")
			{
				leetcode.GET("", leetcodeController.GetAllProblems)
				leetcode.GET("/search", leetcodeController.SearchProblems)
				leetcode.GET("/difficulty", leetcodeController.GetProblemsByDifficulty)
				leetcode.GET("/page", leetcodeController.GetProblemsWithPagination)
				leetcode.GET("/:id", leetcodeController.GetProblemByID)

				leetcode.Use(authMiddleware.AdminRequired())
				{
					leetcode.POST("", leetcodeController.CreateProblem)
					leetcode.PUT("/:id", leetcodeController.UpdateProblem)
					leetcode.DELETE("/:id", leetcodeController.DeleteProblem)
				}
			}
		}
	}

	// web socket
	router.GET("/ws/matching", authMiddleware.WebSocketAuthRequired(), wsController.HandleMatchmaking)
	router.GET("/ws/:gameId", authMiddleware.WebSocketAuthRequired(), wsController.HandleWebSocket)

	return router
}
