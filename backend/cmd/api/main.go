package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/Dongmoon29/code_racer/docs" // Import docs for swagger
	"github.com/Dongmoon29/code_racer/internal/config"
	"github.com/Dongmoon29/code_racer/internal/controller"
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
	// initialize repositories
	userRepository := repository.NewUserRepository(db, appLogger)
	matchRepository := repository.NewMatchRepository(db, appLogger)
	leetCodeRepo := repository.NewLeetCodeRepository(db, appLogger)

	// initialize services
	authService := service.NewAuthService(userRepository, cfg.JWTSecret, appLogger)
	userService := service.NewUserService(userRepository, appLogger)
	judgeService := service.NewJudgeService(cfg.Judge0APIKey, cfg.Judge0APIEndpoint, appLogger)
	matchService := service.NewMatchService(matchRepository, leetCodeRepo, rdb, judgeService, appLogger)

	// Matchmaking service as mediator (without WebSocket initially)
	matchmakingService := service.NewMatchmakingService(matchService, nil, rdb, appLogger)

	// WebSocket service with matchmaking dependency
	wsService := service.NewWebSocketService(rdb, appLogger, matchmakingService)

	// Set WebSocket service in matchmaking service (avoid circular reference)
	matchmakingService.SetWebSocketService(wsService)

	// init web socket hub
	wsHub := wsService.InitHub()
	go wsHub.Run()

	// initialize LeetCode service
	leetCodeService := service.NewLeetCodeService(leetCodeRepo, appLogger)

	// init controllers and middleware
	return &dependencies{
		authController:     controller.NewAuthController(authService, appLogger),
		matchController:    controller.NewMatchController(matchService, appLogger),
		userController:     controller.NewUserController(userService, appLogger),
		leetcodeController: controller.NewLeetCodeController(leetCodeService, appLogger),
		wsController:       controller.NewWebSocketController(wsService, appLogger),
		authMiddleware:     middleware.NewAuthMiddleware(authService, userRepository, appLogger),
	}
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

	log.Info().Msg("Server exited gracefully")
}
