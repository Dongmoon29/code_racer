package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/Dongmoon29/code_racer/internal/config"
	"github.com/Dongmoon29/code_racer/internal/controller"
	"github.com/Dongmoon29/code_racer/internal/events"
	"github.com/Dongmoon29/code_racer/internal/interfaces"
	logger "github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/middleware"
	"github.com/Dongmoon29/code_racer/internal/repository"
	"github.com/Dongmoon29/code_racer/internal/router"
	"github.com/Dongmoon29/code_racer/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func main() {
	appLogger := logger.SetupGlobalLogger()

	cfg, oauthCfg, db, rdb := initializeApp(appLogger)

	deps := initializeDependencies(db, rdb, cfg, oauthCfg, appLogger)

	r := router.Setup(
		deps.authController,
		deps.matchController,
		deps.userController,
		deps.problemController,
		deps.wsController,
		deps.followController,
		deps.communityController,
		deps.postCommentController,
		deps.authMiddleware,
		cfg,
		db,
		rdb,
	)

	startServer(r, cfg.ServerPort, deps.wsHub, db, rdb, appLogger)
}

func initializeApp(appLogger logger.Logger) (*config.Config, *config.OAuthConfig, *gorm.DB, *redis.Client) {
	config.LoadEnvFile(appLogger)
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal().
			Err(err).
			Msg("Failed to load application configuration. Please check your environment variables")
	}

	oauthCfg, err := config.LoadOAuthConfig()
	if err != nil {
		appLogger.Warn().Err(err).Msg("Failed to load OAuth configuration")
		oauthCfg = &config.OAuthConfig{}
	}

	db, err := config.InitDatabase(cfg, appLogger)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize database")
	}

	rdb, err := config.InitRedis(cfg, appLogger)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize Redis")
	}

	if err := config.SetupDatabase(db); err != nil {
		log.Fatal().Err(err).Msg("Failed to setup database")
	}

	return cfg, oauthCfg, db, rdb
}

type dependencies struct {
	authController        *controller.AuthController
	matchController       *controller.MatchController
	userController        *controller.UserController
	problemController     *controller.ProblemController
	wsController          *controller.WebSocketController
	followController      *controller.FollowController
	communityController   *controller.CommunityController
	postCommentController *controller.PostCommentController
	authMiddleware        *middleware.AuthMiddleware
	wsHub                 *service.Hub
}

func initializeDependencies(db *gorm.DB, rdb *redis.Client, cfg *config.Config, oauthCfg *config.OAuthConfig, appLogger logger.Logger) *dependencies {
	repositories := initializeRepositories(db, appLogger)
	services, wsHub := initializeServices(repositories, rdb, cfg, oauthCfg, appLogger)
	controllers := initializeControllers(services, oauthCfg, appLogger)
	middleware := initializeMiddleware(services, repositories, appLogger)

	return &dependencies{
		authController:        controllers.authController,
		matchController:       controllers.matchController,
		userController:        controllers.userController,
		problemController:     controllers.problemController,
		wsController:          controllers.wsController,
		followController:      controllers.followController,
		communityController:   controllers.communityController,
		postCommentController: controllers.postCommentController,
		authMiddleware:        middleware.authMiddleware,
		wsHub:                 wsHub,
	}
}

func initializeRepositories(db *gorm.DB, appLogger logger.Logger) *repositories {
	return &repositories{
		userRepository:        repository.NewUserRepository(db, appLogger),
		matchRepository:       repository.NewMatchRepository(db, appLogger),
		problemRepo:           repository.NewProblemRepository(db, appLogger),
		followRepository:      repository.NewFollowRepository(db, appLogger),
		communityRepository:   repository.NewCommunityRepository(db, appLogger),
		postCommentRepository: repository.NewPostCommentRepository(db, appLogger),
	}
}

func initializeServices(repos *repositories, rdb *redis.Client, cfg *config.Config, oauthCfg *config.OAuthConfig, appLogger logger.Logger) (*services, *service.Hub) {
	authService := service.NewAuthService(repos.userRepository, cfg.JWTSecret, oauthCfg, appLogger)
	userService := service.NewUserService(repos.userRepository, repos.matchRepository, appLogger)

	// Initialize EventBus
	eventBus := events.NewEventBus()

	// Initialize JudgeService first (no direct WebSocket dependency)
	judgeService := service.NewJudgeService(cfg.Judge0APIKey, cfg.Judge0APIEndpoint, appLogger, eventBus)

	// Create MatchService without WebSocket dependency
	matchService := service.NewMatchService(repos.matchRepository, repos.problemRepo, rdb, judgeService, repos.userRepository, appLogger, nil, eventBus)

	// Initialize Matchmaking and WebSocket services
	matchmakingService := service.NewMatchmakingService(matchService, rdb, appLogger, eventBus)
	wsService := service.NewWebSocketService(rdb, appLogger, matchmakingService, repos.userRepository, eventBus)

	// Start WebSocket hub
	wsHub := wsService.InitHub()
	go wsHub.Run()

	problemService := service.NewProblemService(repos.problemRepo, appLogger)
	followService := service.NewFollowService(repos.followRepository, appLogger)
	communityService := service.NewCommunityService(repos.communityRepository, appLogger)
	postCommentService := service.NewPostCommentService(repos.postCommentRepository, appLogger)

	return &services{
		authService:        authService,
		userService:        userService,
		judgeService:       judgeService,
		matchService:       matchService,
		matchmakingService: matchmakingService,
		wsService:          wsService,
		problemService:     problemService,
		followService:      followService,
		communityService:   communityService,
		postCommentService: postCommentService,
	}, wsHub
}

func initializeControllers(services *services, oauthCfg *config.OAuthConfig, appLogger logger.Logger) *controllers {
	allowedOrigins := getAllowedOrigins()
	environment := getEnvironment()

	oauthConfigProvider := controller.NewOAuthConfigProvider(oauthCfg)

	return &controllers{
		authController:        controller.NewAuthController(services.authService, appLogger, oauthConfigProvider),
		matchController:       controller.NewMatchController(services.matchService, appLogger),
		userController:        controller.NewUserController(services.userService, appLogger),
		problemController:     controller.NewProblemController(services.problemService, appLogger),
		wsController:          controller.NewWebSocketController(services.wsService, appLogger, allowedOrigins, environment),
		followController:      controller.NewFollowController(services.followService, appLogger),
		communityController:   controller.NewCommunityController(services.communityService, appLogger),
		postCommentController: controller.NewPostCommentController(services.postCommentService, appLogger),
	}
}

func addOriginWithHTTPS(origins []string, origin string) []string {
	origins = append(origins, origin)
	if strings.HasPrefix(origin, "http://") {
		httpsVersion := strings.Replace(origin, "http://", "https://", 1)
		origins = append(origins, httpsVersion)
	}
	return origins
}

func getAllowedOrigins() []string {
	var origins []string

	// Add frontend URL
	if frontendURL := os.Getenv("FRONTEND_URL"); frontendURL != "" {
		origins = addOriginWithHTTPS(origins, frontendURL)
	}

	// Add additional CORS origins
	if corsOrigins := os.Getenv("CORS_ALLOWED_ORIGINS"); corsOrigins != "" {
		for origin := range strings.SplitSeq(corsOrigins, ",") {
			origin = strings.TrimSpace(origin)
			if origin != "" {
				origins = addOriginWithHTTPS(origins, origin)
			}
		}
	}

	return origins
}

func getEnvironment() string {
	if env := os.Getenv("ENVIRONMENT"); env != "" {
		return env
	}
	return "production"
}

func initializeMiddleware(services *services, repos *repositories, appLogger logger.Logger) *middlewareInstances {
	return &middlewareInstances{
		authMiddleware: middleware.NewAuthMiddleware(services.authService, repos.userRepository, appLogger),
	}
}

type repositories struct {
	userRepository        interfaces.UserRepository
	matchRepository       repository.MatchRepository
	problemRepo           repository.ProblemRepository
	followRepository      interfaces.FollowRepository
	communityRepository   interfaces.CommunityRepository
	postCommentRepository interfaces.PostCommentRepository
}

type services struct {
	authService        interfaces.AuthService
	userService        service.UserService
	judgeService       interfaces.JudgeService
	matchService       service.MatchService
	matchmakingService service.MatchmakingService
	wsService          service.WebSocketService
	problemService     service.ProblemService
	followService      service.FollowService
	communityService   interfaces.CommunityService
	postCommentService interfaces.PostCommentService
}

type controllers struct {
	authController        *controller.AuthController
	matchController       *controller.MatchController
	userController        *controller.UserController
	problemController     *controller.ProblemController
	wsController          *controller.WebSocketController
	followController      *controller.FollowController
	communityController   *controller.CommunityController
	postCommentController *controller.PostCommentController
}

type middlewareInstances struct {
	authMiddleware *middleware.AuthMiddleware
}

func startServer(router *gin.Engine, port string, wsHub *service.Hub, db *gorm.DB, rdb *redis.Client, appLogger logger.Logger) {
	srv := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	go func() {
		log.Info().Msgf("Server starting on port %s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("Failed to start server")
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info().Msg("Shutting down server...")

	// Shutdown WebSocket hub
	if wsHub != nil {
		wsHub.Shutdown()
		// Give some time for WebSocket connections to close
		time.Sleep(1 * time.Second)
	}

	// Shutdown HTTP server with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Error().Err(err).Msg("Server forced to shutdown")
	} else {
		log.Info().Msg("Server exited gracefully")
	}

	// Close database connection
	if db != nil {
		if sqlDB, err := db.DB(); err == nil {
			if err := sqlDB.Close(); err != nil {
				appLogger.Error().Err(err).Msg("Failed to close database connection")
			} else {
				appLogger.Info().Msg("Database connection closed")
			}
		}
	}

	// Close Redis connection
	if rdb != nil {
		if err := rdb.Close(); err != nil {
			appLogger.Error().Err(err).Msg("Failed to close Redis connection")
		} else {
			appLogger.Info().Msg("Redis connection closed")
		}
	}
}
