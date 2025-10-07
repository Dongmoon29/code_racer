package testutil

import (
	"os"

	"github.com/Dongmoon29/code_racer/internal/config"
)

// SetupTestConfig creates and returns a config instance for testing
// Note: This uses hardcoded test values. In CI/CD environments,
// these should be configured via environment variables
func SetupTestConfig() *config.Config {
	judgeKey := os.Getenv("JUDGE0_API_KEY")
	judgeEndpoint := os.Getenv("JUDGE0_API_ENDPOINT")
	if judgeEndpoint == "" {
		judgeEndpoint = "https://judge0-ce.p.rapidapi.com"
	}
	return &config.Config{
		DBHost:     "localhost",
		DBUser:     "postgres",
		DBPassword: "postgres",
		DBName:     "code_racer_test",
		DBPort:     "5432",

		RedisHost:     "localhost",
		RedisPort:     "6379",
		RedisUsername: "default",
		RedisPassword: "",

		JWTSecret: "jwtsecret",

		ServerPort: "8081",

		Judge0APIKey:      judgeKey,
		Judge0APIEndpoint: judgeEndpoint,
	}
}
