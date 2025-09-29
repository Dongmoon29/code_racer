package config

import (
	"github.com/Dongmoon29/code_racer/internal/controller"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/middleware"
	"github.com/Dongmoon29/code_racer/internal/repository"
	"github.com/Dongmoon29/code_racer/internal/service"
	"github.com/go-redis/redis/v8"
	"gorm.io/gorm"
)

type Dependencies struct {
	AuthController *controller.AuthController
	GameController *controller.GameController
	UserController *controller.UserController
	WsController   *controller.WebSocketController
	AuthMiddleware *middleware.AuthMiddleware
}

func InitializeDependencies(db *gorm.DB, rdb *redis.Client, cfg *Config, appLogger logger.Logger) *Dependencies {
	userRepository := repository.NewUserRepository(db, appLogger)
	gameRepository := repository.NewGameRepository(db, appLogger)
	leetCodeRepository := repository.NewLeetCodeRepository(db, appLogger)
	authService := service.NewAuthService(userRepository, cfg.JWTSecret, appLogger)
	userService := service.NewUserService(userRepository, appLogger)
	judgeService := service.NewJudgeService(cfg.Judge0APIKey, cfg.Judge0APIEndpoint, appLogger)
	gameService := service.NewGameService(gameRepository, leetCodeRepository, rdb, judgeService, appLogger)
	matchmakingService := service.NewMatchmakingService(gameService, nil, rdb, appLogger)
	wsService := service.NewWebSocketService(rdb, appLogger, matchmakingService)

	matchmakingService.SetWebSocketService(wsService)

	wsHub := wsService.InitHub()
	go wsHub.Run()

	return &Dependencies{
		AuthController: controller.NewAuthController(authService, appLogger),
		GameController: controller.NewGameController(gameService, appLogger),
		UserController: controller.NewUserController(userService, appLogger),
		WsController:   controller.NewWebSocketController(wsService, appLogger),
		AuthMiddleware: middleware.NewAuthMiddleware(authService, userRepository, appLogger),
	}
}
