package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

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
	// Gin 모드 로깅
	log.Info().Msgf("Starting application in %s mode", gin.Mode())

	// 로그 설정
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	// 개발 환경에서는 더 자세한 로깅
	if !isProduction() {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
		log.Info().Msg("Global log level set to DEBUG (development mode)")
	} else {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
		log.Info().Msg("Global log level set to INFO (production mode)")
	}

	log.Logger = log.Output(zerolog.ConsoleWriter{
		Out:        os.Stdout,
		TimeFormat: "2006-01-02 15:04:05",
		NoColor:    isProduction(),
	})
	logger := logger.NewZerologLogger(log.Logger)

	// 개발 환경에서는 .env 파일 로드
	if !isProduction() {
		if err := godotenv.Load(); err != nil {
			logger.Warn().Msg("No .env file found")
		}
		logger.Info().Msg("Loaded .env file")
	}

	// 환경 변수 로드
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load configuration")
	}

	// DB 초기화
	db, err := config.InitDatabase(cfg, logger)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize database")
	}

	// Redis 초기화
	rdb := config.InitRedis(cfg)

	// 데이터베이스 설정
	if err := config.SetupDatabase(db); err != nil {
		log.Fatal().Err(err).Msg("Failed to setup database")
	}

	// 의존성 초기화
	deps := initializeDependencies(db, rdb, cfg, logger)

	// 라우터 설정
	r := router.Setup(
		deps.authController,
		deps.gameController,
		deps.userController,
		deps.wsController,
		deps.authMiddleware,
		cfg,
	)

	// 서버 시작
	startServer(r, cfg.ServerPort)
}

type dependencies struct {
	authController *controller.AuthController
	gameController *controller.GameController
	userController *controller.UserController
	wsController   *controller.WebSocketController
	authMiddleware *middleware.AuthMiddleware
}

func initializeDependencies(db *gorm.DB, rdb *redis.Client, cfg *config.Config, appLogger logger.Logger) *dependencies {
	// 레포지토리 초기화
	userRepository := repository.NewUserRepository(db, appLogger)
	gameRepository := repository.NewGameRepository(db, appLogger)
	leetCodeRepo := repository.NewLeetCodeRepository(db, appLogger)

	// 서비스 초기화
	authService := service.NewAuthService(userRepository, cfg.JWTSecret, appLogger)
	userService := service.NewUserService(userRepository, appLogger)
	judgeService := service.NewJudgeService(cfg.Judge0APIKey, cfg.Judge0APIEndpoint, appLogger)
	wsService := service.NewWebSocketService(rdb, appLogger)
	gameService := service.NewGameService(gameRepository, leetCodeRepo, rdb, wsService, judgeService, appLogger)

	// 웹소켓 허브 초기화
	wsHub := wsService.InitHub()
	go wsHub.Run()

	// 컨트롤러 및 미들웨어 초기화
	return &dependencies{
		authController: controller.NewAuthController(authService, appLogger),
		gameController: controller.NewGameController(gameService, appLogger),
		userController: controller.NewUserController(userService, appLogger),
		wsController:   controller.NewWebSocketController(wsService, appLogger),
		authMiddleware: middleware.NewAuthMiddleware(authService, userRepository, appLogger),
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
