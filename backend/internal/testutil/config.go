package testutil

import (
	"github.com/Dongmoon29/code_racer/internal/config"
)

// SetupTestConfig creates and returns a config instance for testing
// TODO: Create test env
func SetupTestConfig() *config.Config {
	return &config.Config{
		// 테스트용 데이터베이스 설정
		DBHost:     "localhost",
		DBUser:     "postgres",
		DBPassword: "postgres",
		DBName:     "code_racer_test", // 테스트용 DB는 별도로 사용
		DBPort:     "5432",

		// 테스트용 Redis 설정
		RedisHost:     "localhost",
		RedisPort:     "6379",
		RedisUsername: "default",
		RedisPassword: "",

		// 테스트용 JWT 설정
		JWTSecret: "jwtsecret",

		// 테스트용 서버 설정
		ServerPort: "8081", // 실제 서버와 포트 충돌 방지

		// 테스트용 Judge0 API 설정
		Judge0APIKey:      "21031b5e62msh0d70c4eec062706p1c6c61jsn2d5fe6103e64",
		Judge0APIEndpoint: "https://judge0-ce.p.rapidapi.com",
	}
}
