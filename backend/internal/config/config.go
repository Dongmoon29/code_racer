package config

import (
	"os"
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
func LoadConfig() *Config {
	return &Config{
		// 데이터베이스 설정
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "code_racer"),
		DBPort:     getEnv("DB_PORT", "5432"),

		// Redis 설정
		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnv("REDIS_PORT", "6379"),
		RedisUsername: getEnv("REDIS_USERNAME", "default"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),

		// JWT 설정
		JWTSecret: getEnv("JWT_SECRET", "jwtsecret"),

		// 서버 설정
		ServerPort: getEnv("PORT", "8080"),

		// Judge0 API 설정
		Judge0APIKey:      getEnv("JUDGE0_API_KEY", ""),
		Judge0APIEndpoint: getEnv("JUDGE0_API_ENDPOINT", "https://judge0-ce.p.rapidapi.com"),
	}
}

// getEnv 환경 변수를 가져오거나 기본값을 반환합니다
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
