package router

import (
	"net/http"
	"time"

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
	matchController *controller.MatchController,
	userController *controller.UserController,
	problemController *controller.ProblemController,
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
			match := secured.Group("/matches")
			{
				match.GET("/:id", matchController.GetMatch)
				match.POST("/:id/submit", matchController.SubmitSolution)
				match.POST("/single", matchController.CreateSinglePlayerMatch)
			}

			// users
			user := secured.Group("/users")
			{
				user.GET("/me", userController.GetCurrentUser)
				user.GET("/:userId/profile", userController.GetProfile)
				user.PUT("/profile", userController.UpdateProfile)
				user.GET("/leaderboard", userController.GetLeaderboard)
			}

			// admin users
			admin := secured.Group("/admin")
			admin.Use(authMiddleware.AdminRequired())
			{
				admin.GET("/users", userController.AdminListUsers)
			}

			// problems
			problems := secured.Group("/problems")
			{
				problems.GET("", problemController.GetAllProblems)
				problems.GET("/search", problemController.SearchProblems)
				problems.GET("/difficulty", problemController.GetProblemsByDifficulty)
				problems.GET("/page", problemController.GetProblemsWithPagination)
				problems.GET("/:id", problemController.GetProblemByID)

				problems.Use(authMiddleware.AdminRequired())
				{
					problems.POST("", problemController.CreateProblem)
					problems.PUT("/:id", problemController.UpdateProblem)
					problems.DELETE("/:id", problemController.DeleteProblem)
				}
			}
		}
	}

	// web socket
	router.GET("/ws/matching", authMiddleware.WebSocketAuthRequired(), wsController.HandleMatchmaking)
	router.GET("/ws/:matchId", authMiddleware.WebSocketAuthRequired(), wsController.HandleWebSocket)

	return router
}
