package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/util"
)

// Config 앱의 설정 정보를 담는 구조체
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

	if dbName, err := util.GetenvRequired("DB_NAME"); err != nil {
		missingVars = append(missingVars, "DB_NAME")
	} else {
		config.DBName = dbName
	}

	if dbPort, err := util.GetenvRequired("DB_PORT"); err != nil {
		missingVars = append(missingVars, "DB_PORT")
	} else {
		config.DBPort = dbPort
	}

	// Redis 설정
	if redisHost, err := util.GetenvRequired("REDIS_HOST"); err != nil {
		missingVars = append(missingVars, "REDIS_HOST")
	} else {
		config.RedisHost = redisHost
	}

	if redisPort, err := util.GetenvRequired("REDIS_PORT"); err != nil {
		missingVars = append(missingVars, "REDIS_PORT")
	} else {
		config.RedisPort = redisPort
	}

	if redisUsername, err := util.GetenvRequired("REDIS_USERNAME"); err != nil {
		missingVars = append(missingVars, "REDIS_USERNAME")
	} else {
		config.RedisUsername = redisUsername
	}

	// Redis 패스워드는 선택적일 수 있음
	config.RedisPassword = os.Getenv("REDIS_PASSWORD")

	// JWT 설정
	if jwtSecret, err := util.GetenvRequired("JWT_SECRET"); err != nil {
		missingVars = append(missingVars, "JWT_SECRET")
	} else {
		config.JWTSecret = jwtSecret
	}

	// 서버 설정
	if serverPort, err := util.GetenvRequired("PORT"); err != nil {
		missingVars = append(missingVars, "PORT")
	} else {
		config.ServerPort = serverPort
	}

	// Judge0 API 설정
	if judge0APIKey, err := util.GetenvRequired("JUDGE0_API_KEY"); err != nil {
		missingVars = append(missingVars, "JUDGE0_API_KEY")
	} else {
		config.Judge0APIKey = judge0APIKey
	}

	if judge0APIEndpoint, err := util.GetenvRequired("JUDGE0_API_ENDPOINT"); err != nil {
		missingVars = append(missingVars, "JUDGE0_API_ENDPOINT")
	} else {
		config.Judge0APIEndpoint = judge0APIEndpoint
	}

	// 누락된 환경변수가 있는지 확인
	if len(missingVars) > 0 {
		return nil, fmt.Errorf("missing required environment variables: %s", strings.Join(missingVars, ", "))
	}

	return &config, nil
}
