package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Dongmoon29/code_racer/internal/config"
	"github.com/Dongmoon29/code_racer/internal/controller"
	logger "github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/middleware"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/repository"
	"github.com/Dongmoon29/code_racer/internal/router"
	"github.com/Dongmoon29/code_racer/internal/seed"
	"github.com/Dongmoon29/code_racer/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"
)

// isProduction returns true if the application is running in production mode
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
	} else {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}

	log.Logger = log.Output(zerolog.ConsoleWriter{
		Out:        os.Stdout,
		TimeFormat: "2006-01-02 15:04:05",
		NoColor:    isProduction(), // 프로덕션에서는 색상 비활성화
	})
	logger := logger.NewZerologLogger(log.Logger)

	// 개발 환경에서는 .env 파일 로드
	if !isProduction() {
		if err := godotenv.Load(); err != nil {
			logger.Warn().Msg("No .env file found")
		}
		logger.Info().Msg("Loaded .env file")

	}

	cfg := config.LoadConfig()
	db, err := initDatabase(cfg, logger)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize database")
	}
	rdb := initRedis(cfg)

	// 데이터베이스 설정
	if err := setupDatabase(db); err != nil {
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

func setupDatabase(db *gorm.DB) error {
	operations := []struct {
		name string
		fn   func() error
	}{
		{"Enable UUID extension", func() error {
			return db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";").Error
		}},
		{"Auto migrate", func() error {
			return db.AutoMigrate(&model.User{}, &model.Game{}, &model.LeetCode{})
		}},
		{"Seed data", func() error {
			return seed.SeedLeetCodeProblem(db)
		}},
	}

	for _, op := range operations {
		if err := op.fn(); err != nil {
			return fmt.Errorf("%s: %w", op.name, err)
		}
	}

	return nil
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
	userRepo := repository.NewUserRepository(db, appLogger)
	gameRepo := repository.NewGameRepository(db, appLogger)
	leetCodeRepo := repository.NewLeetCodeRepository(db, appLogger)

	// 서비스 초기화
	authService := service.NewAuthService(userRepo, cfg.JWTSecret, appLogger)
	userService := service.NewUserService(userRepo, appLogger)
	judgeService := service.NewJudgeService(cfg.Judge0APIKey, cfg.Judge0APIEndpoint, appLogger)
	wsService := service.NewWebSocketService(rdb, appLogger)
	gameService := service.NewGameService(gameRepo, leetCodeRepo, rdb, wsService, judgeService, appLogger)

	// 웹소켓 허브 초기화
	wsHub := wsService.InitHub()
	go wsHub.Run()

	// 컨트롤러 및 미들웨어 초기화
	return &dependencies{
		authController: controller.NewAuthController(authService, appLogger),
		gameController: controller.NewGameController(gameService, appLogger),
		userController: controller.NewUserController(userService, appLogger),
		wsController:   controller.NewWebSocketController(wsService, appLogger),
		authMiddleware: middleware.NewAuthMiddleware(authService, appLogger),
	}
}

func initDatabase(cfg *config.Config, appLogger logger.Logger) (*gorm.DB, error) {
	appLogger.Info().
		Str("host", cfg.DBHost).
		Str("user", cfg.DBUser).
		Str("database", cfg.DBName).
		Str("port", cfg.DBPort).
		Msg("Database configuration")

	// SSL 모드를 환경에 따라 설정
	sslMode := "disable" // 로컬 개발 환경 기본값
	if isProduction() {
		sslMode = "require" // 프로덕션 환경
	}

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Seoul",
		cfg.DBHost,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
		cfg.DBPort,
		sslMode,
	)

	// 비밀번호를 마스킹한 DSN 로깅
	maskedDsn := fmt.Sprintf(
		"host=%s user=%s password=*** dbname=%s port=%s sslmode=%s TimeZone=Asia/Seoul",
		cfg.DBHost,
		cfg.DBUser,
		cfg.DBName,
		cfg.DBPort,
		sslMode,
	)
	appLogger.Info().
		Str("dsn", maskedDsn).
		Msg("Attempting database connection")

	gormLogger := gormLogger.New(
		logger.NewGormWriter(appLogger),
		gormLogger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  gormLogger.Info,
			IgnoreRecordNotFoundError: true,
			Colorful:                  !isProduction(),
		},
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: gormLogger,
	})

	if err != nil {
		appLogger.Error().
			Err(err).
			Msg("Failed to connect to database")
		return nil, err
	}

	appLogger.Info().Msg("Successfully connected to database")
	return db, nil
}

func initRedis(cfg *config.Config) *redis.Client {
	options := &redis.Options{
		Addr: cfg.RedisHost + ":" + cfg.RedisPort,
	}

	// 프로덕션 환경에서만 TLS와 인증 설정 추가
	if isProduction() {
		options.Username = cfg.RedisUsername
		options.Password = cfg.RedisPassword
		options.TLSConfig = &tls.Config{
			MinVersion: tls.VersionTLS12,
		}
	}

	rdb := redis.NewClient(options)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to Redis")
	}

	log.Info().Msgf("Connected to Redis at %s:%s", cfg.RedisHost, cfg.RedisPort)
	return rdb
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
