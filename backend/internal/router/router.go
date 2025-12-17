package router

import (
	"context"
	"net/http"
	"time"

	"github.com/Dongmoon29/code_racer/internal/config"
	"github.com/Dongmoon29/code_racer/internal/controller"
	"github.com/Dongmoon29/code_racer/internal/middleware"
	"github.com/Dongmoon29/code_racer/internal/util"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"
)

// Setup initializes and returns the router with all routes configured
func Setup(
	authController *controller.AuthController,
	matchController *controller.MatchController,
	userController *controller.UserController,
	problemController *controller.ProblemController,
	wsController *controller.WebSocketController,
	followController *controller.FollowController,
	communityController *controller.CommunityController,
	postCommentController *controller.PostCommentController,
	authMiddleware *middleware.AuthMiddleware,
	cfg *config.Config,
	db *gorm.DB,
	rdb *redis.Client,
) *gin.Engine {
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())

	// health check endpoint with DB and Redis status
	router.GET("/health", func(c *gin.Context) {
		status := gin.H{
			"status": "ok",
		}
		
		// Check database connection
		if db != nil {
			sqlDB, err := db.DB()
			if err == nil {
				if err := sqlDB.Ping(); err == nil {
					status["database"] = "connected"
				} else {
					status["database"] = "disconnected"
				}
			}
		}
		
		// Check Redis connection
		if rdb != nil {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()
			if err := rdb.Ping(ctx).Err(); err == nil {
				status["redis"] = "connected"
			} else {
				status["redis"] = "disconnected"
			}
		}
		
		c.JSON(200, status)
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
	
	// Allow credentials when using cookies for authentication
	// In production, ensure CORS origins are properly configured
	allowCredentials := !util.IsProduction() || len(allowedOrigins) > 0
	
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     allowedMethods,
		AllowHeaders:     allowedHeaders,
		ExposeHeaders:    exposeHeaders,
		AllowCredentials: allowCredentials,
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

		// Public user routes (stats can be viewed without auth, but optional auth for is_following)
		api.GET("/users/:userId/follow/stats", authMiddleware.OptionalAuth(), followController.GetFollowStats)

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

			// Follow routes
			user.POST("/:userId/follow", followController.Follow)
			user.DELETE("/:userId/follow", followController.Unfollow)
			user.GET("/:userId/followers", followController.GetFollowers)
			user.GET("/:userId/following", followController.GetFollowing)
		}

		// Community routes (community board)
		community := secured.Group("/feedback") // Keep API path as /feedback for backward compatibility
		{
			// Public routes - all authenticated users can view and create
			community.POST("", communityController.CreatePost)
			community.GET("", communityController.ListPosts) // All users can view all posts
			community.GET("/my", communityController.GetUserPosts)
			community.GET("/:id", communityController.GetPost)

			// Post comments routes (separate group to avoid wildcard conflict)
			comments := community.Group("/comments")
			{
				comments.GET("/:feedbackId", postCommentController.GetComments)
				comments.POST("/:feedbackId", postCommentController.CreateComment)
				comments.PUT("/:id", postCommentController.UpdateComment)
				comments.DELETE("/:id", postCommentController.DeleteComment)
			}

			// Admin-only routes
			community.Use(authMiddleware.AdminRequired())
			{
				community.PATCH("/:id/status", communityController.UpdatePostStatus)
				community.DELETE("/:id", communityController.DeletePost)
			}
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
