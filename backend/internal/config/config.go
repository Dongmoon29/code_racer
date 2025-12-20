package config

import (
	"fmt"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/util"
	"github.com/joho/godotenv"
)

type Config struct {
	// 데이터베이스 설정
	DBHost     string
	DBUser     string
	DBPassword string
	DBName     string
	DBPort     string

	// Redis 설정
	RedisHost     string
	RedisPort     string
	RedisUsername string
	RedisPassword string

	// JWT 설정
	JWTSecret string

	// 서버 설정
	ServerPort string

	// Judge0 API 설정
	Judge0APIKey      string
	Judge0APIEndpoint string
}

// LoadConfig 환경 변수에서 설정을 로드합니다
func LoadConfig() (*Config, error) {
	var missingVars []string
	var config Config

	// 데이터베이스 설정
	if dbHost, err := util.GetenvRequired("DB_HOST"); err != nil {
		missingVars = append(missingVars, "DB_HOST")
	} else {
		config.DBHost = dbHost
	}

	if dbUser, err := util.GetenvRequired("DB_USER"); err != nil {
		missingVars = append(missingVars, "DB_USER")
	} else {
		config.DBUser = dbUser
	}

	if dbPassword, err := util.GetenvRequired("DB_PASSWORD"); err != nil {
		missingVars = append(missingVars, "DB_PASSWORD")
	} else {
		config.DBPassword = dbPassword
	}

	dbPort := util.GetEnv("DB_PORT", "5432")
	if err := util.ValidatePort(dbPort); err != nil {
		return nil, fmt.Errorf("invalid database port configuration (DB_PORT=%s): %w", dbPort, err)
	}
	config.DBPort = dbPort

	if dbName, err := util.GetenvRequired("DB_NAME"); err != nil {
		missingVars = append(missingVars, "DB_NAME")
	} else {
		config.DBName = dbName
	}

	// Redis 설정
	if redisHost, err := util.GetenvRequired("REDIS_HOST"); err != nil {
		missingVars = append(missingVars, "REDIS_HOST")
	} else {
		config.RedisHost = redisHost
	}

	config.RedisPort = util.GetEnv("REDIS_PORT", "6379")
	if err := util.ValidatePort(config.RedisPort); err != nil {
		return nil, fmt.Errorf("invalid Redis port configuration (REDIS_PORT=%s): %w", config.RedisPort, err)
	}

	config.RedisUsername = util.GetEnv("REDIS_USERNAME", "default")

	// Redis password is optional
	config.RedisPassword = util.GetEnv("REDIS_PASSWORD", "")

	// JWT 설정
	if jwtSecret, err := util.GetenvRequired("JWT_SECRET"); err != nil {
		missingVars = append(missingVars, "JWT_SECRET")
	} else {
		// Validate JWT secret length and complexity
		if len(jwtSecret) < constants.MinJWTSecretLength {
			return nil, fmt.Errorf("JWT_SECRET must be at least %d characters long for security", constants.MinJWTSecretLength)
		}
		config.JWTSecret = jwtSecret
	}

	config.ServerPort = util.GetEnv("PORT", "8080")
	if err := util.ValidatePort(config.ServerPort); err != nil {
		return nil, fmt.Errorf("invalid server port configuration (PORT=%s): %w", config.ServerPort, err)
	}

	// Judge0 API 설정
	if judge0APIKey, err := util.GetenvRequired("JUDGE0_API_KEY"); err != nil {
		missingVars = append(missingVars, "JUDGE0_API_KEY")
	} else {
		config.Judge0APIKey = judge0APIKey
	}

	config.Judge0APIEndpoint = util.GetEnv("JUDGE0_API_ENDPOINT", "https://judge0-ce.p.rapidapi.com")
	if err := util.ValidateURL(config.Judge0APIEndpoint); err != nil {
		return nil, fmt.Errorf("invalid Judge0 API endpoint (JUDGE0_API_ENDPOINT=%s): %w", config.Judge0APIEndpoint, err)
	}

	// 누락된 환경변수가 있는지 확인
	if len(missingVars) > 0 {
		return nil, fmt.Errorf("missing required environment variables: %s. Please set these in your .env file or environment", strings.Join(missingVars, ", "))
	}

	return &config, nil
}

// LoadEnvFile loads .env file in development mode
func LoadEnvFile(appLogger logger.Logger) {
	if !util.IsProduction() {
		if err := godotenv.Load(); err != nil {
			appLogger.Warn().Msg("No .env file found")
		} else {
			appLogger.Info().Msg("Loaded .env file")
		}
	}
}
