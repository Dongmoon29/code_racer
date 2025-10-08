package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	_ "github.com/Dongmoon29/code_racer/docs" // Import docs for swagger
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
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

// isProduction returns true if the application is running in production mode...
func isProduction() bool {
	return gin.Mode() == gin.ReleaseMode
}

func main() {
	// log (dev or prod) mode
	log.Info().Msgf("Starting application in %s mode", gin.Mode())

	// set log format
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	if !isProduction() {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
		log.Info().Msg("Global log level set to DEBUG (development mode)")
	} else {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
		log.Info().Msg("Global log level set to INFO (production mode)")
	}

	log.Logger = log.Output(zerolog.ConsoleWriter{
		Out:        os.Stdout,
		TimeFormat: "2006-01-02 15:04:05",
		NoColor:    isProduction(),
	})
	logger := logger.NewZerologLogger(log.Logger)

	// load .env file (dev mode)
	if !isProduction() {
		if err := godotenv.Load(); err != nil {
			logger.Warn().Msg("No .env file found")
		}
		logger.Info().Msg("Loaded .env file")
	}

	// load config
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load configuration")
	}

	// init database
	db, err := config.InitDatabase(cfg, logger)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize database")
	}

	// init redis
	rdb := config.InitRedis(cfg)

	// setup database
	if err := config.SetupDatabase(db); err != nil {
		log.Fatal().Err(err).Msg("Failed to setup database")
	}

	// initialize dependencies
	deps := initializeDependencies(db, rdb, cfg, logger)

	// setup router
	r := router.Setup(
		deps.authController,
		deps.matchController,
		deps.userController,
		deps.leetcodeController,
		deps.wsController,
		deps.authMiddleware,
		cfg,
	)

	// start server
	startServer(r, cfg.ServerPort)
}

type dependencies struct {
	authController     *controller.AuthController
	matchController    *controller.MatchController
	userController     *controller.UserController
	leetcodeController *controller.LeetCodeController
	wsController       *controller.WebSocketController
	authMiddleware     *middleware.AuthMiddleware
}

func initializeDependencies(db *gorm.DB, rdb *redis.Client, cfg *config.Config, appLogger logger.Logger) *dependencies {
	repositories := initializeRepositories(db, appLogger)
	services := initializeServices(repositories, rdb, cfg, appLogger)
	controllers := initializeControllers(services, appLogger)
	middleware := initializeMiddleware(services, repositories, appLogger)

	return &dependencies{
		authController:     controllers.authController,
		matchController:    controllers.matchController,
		userController:     controllers.userController,
		leetcodeController: controllers.leetcodeController,
		wsController:       controllers.wsController,
		authMiddleware:     middleware.authMiddleware,
	}
}

// initializeRepositories creates all repository instances
func initializeRepositories(db *gorm.DB, appLogger logger.Logger) *repositories {
	return &repositories{
		userRepository:  repository.NewUserRepository(db, appLogger),
		matchRepository: repository.NewMatchRepository(db, appLogger),
		leetCodeRepo:    repository.NewLeetCodeRepository(db, appLogger),
	}
}

// initializeServices creates all service instances
func initializeServices(repos *repositories, rdb *redis.Client, cfg *config.Config, appLogger logger.Logger) *services {
	authService := service.NewAuthService(repos.userRepository, cfg.JWTSecret, appLogger)
	userService := service.NewUserService(repos.userRepository, repos.matchRepository, appLogger)
	judgeService := service.NewJudgeService(cfg.Judge0APIKey, cfg.Judge0APIEndpoint, appLogger)
	matchService := service.NewMatchService(repos.matchRepository, repos.leetCodeRepo, rdb, judgeService, repos.userRepository, appLogger)

	// Initialize EventBus
	eventBus := events.NewEventBus()

	// Initialize WebSocket and matchmaking services (event-driven, no circular dependency)
	matchmakingService := service.NewMatchmakingService(matchService, rdb, appLogger, eventBus)
	wsService := service.NewWebSocketService(rdb, appLogger, matchmakingService, repos.userRepository, eventBus)

	// Start WebSocket hub
	wsHub := wsService.InitHub()
	go wsHub.Run()

	leetCodeService := service.NewLeetCodeService(repos.leetCodeRepo, appLogger)

	return &services{
		authService:        authService,
		userService:        userService,
		judgeService:       judgeService,
		matchService:       matchService,
		matchmakingService: matchmakingService,
		wsService:          wsService,
		leetCodeService:    leetCodeService,
	}
}

// initializeControllers creates all controller instances
func initializeControllers(services *services, appLogger logger.Logger) *controllers {
	// Get allowed origins from environment
	allowedOrigins := getAllowedOrigins()
	environment := getEnvironment()

	// Create OAuth config provider
	oauthConfigProvider := controller.NewOAuthConfigProvider()

	return &controllers{
		authController:     controller.NewAuthController(services.authService, appLogger, oauthConfigProvider),
		matchController:    controller.NewMatchController(services.matchService, appLogger),
		userController:     controller.NewUserController(services.userService, appLogger),
		leetcodeController: controller.NewLeetCodeController(services.leetCodeService, appLogger),
		wsController:       controller.NewWebSocketController(services.wsService, appLogger, allowedOrigins, environment),
	}
}

// getAllowedOrigins gets allowed origins from environment variables
func getAllowedOrigins() []string {
	var origins []string

	// Get additional origins from environment variable
	if frontendURL := os.Getenv("FRONTEND_URL"); frontendURL != "" {
		origins = append(origins, frontendURL)
		// Also add HTTPS version
		if strings.HasPrefix(frontendURL, "http://") {
			httpsVersion := strings.Replace(frontendURL, "http://", "https://", 1)
			origins = append(origins, httpsVersion)
		}
	}

	// Get additional origins from CORS_ALLOWED_ORIGINS environment variable
	if corsOrigins := os.Getenv("CORS_ALLOWED_ORIGINS"); corsOrigins != "" {
		envOrigins := strings.Split(corsOrigins, ",")
		for _, o := range envOrigins {
			o = strings.TrimSpace(o)
			if o != "" {
				origins = append(origins, o)
				// Also add HTTPS version
				if strings.HasPrefix(o, "http://") {
					httpsVersion := strings.Replace(o, "http://", "https://", 1)
					origins = append(origins, httpsVersion)
				}
			}
		}
	}

	return origins
}

// getEnvironment gets the current environment
func getEnvironment() string {
	if env := os.Getenv("ENVIRONMENT"); env != "" {
		return env
	}
	return "production" // Default to production
}

// initializeMiddleware creates all middleware instances
func initializeMiddleware(services *services, repos *repositories, appLogger logger.Logger) *middlewareInstances {
	return &middlewareInstances{
		authMiddleware: middleware.NewAuthMiddleware(services.authService, repos.userRepository, appLogger),
	}
}

// Helper structs for dependency injection
type repositories struct {
	userRepository  interfaces.UserRepository
	matchRepository repository.MatchRepository
	leetCodeRepo    repository.LeetCodeRepository
}

type services struct {
	authService        interfaces.AuthService
	userService        service.UserService
	judgeService       interfaces.JudgeService
	matchService       service.MatchService
	matchmakingService service.MatchmakingService
	wsService          service.WebSocketService
	leetCodeService    service.LeetCodeService
}

type controllers struct {
	authController     *controller.AuthController
	matchController    *controller.MatchController
	userController     *controller.UserController
	leetcodeController *controller.LeetCodeController
	wsController       *controller.WebSocketController
}

type middlewareInstances struct {
	authMiddleware *middleware.AuthMiddleware
}

func startServer(router *gin.Engine, port string) {
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

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("Server forced to shutdown")
	}
	//
	log.Info().Msg("Server exited gracefully")
}
