package testutil

import (
	"github.com/Dongmoon29/code_racer/internal/config"
)

// SetupTestConfig creates and returns a config instance for testing
// Note: This uses hardcoded test values. In CI/CD environments,
// these should be configured via environment variables
func SetupTestConfig() *config.Config {
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

		Judge0APIKey:      "21031b5e62msh0d70c4eec062706p1c6c61jsn2d5fe6103e64",
		Judge0APIEndpoint: "https://judge0-ce.p.rapidapi.com",
	}
}
