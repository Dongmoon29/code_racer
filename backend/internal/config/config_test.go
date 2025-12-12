package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// trigger

func setupTestEnv(t *testing.T) func() {
	// 테스트에 필요한 모든 환경 변수 설정
	envVars := map[string]string{
		"DB_HOST":             "test-host",
		"DB_USER":             "test-user",
		"DB_PASSWORD":         "test-password",
		"DB_NAME":             "test-db",
		"DB_PORT":             "5432",
		"REDIS_HOST":          "redis-host",
		"REDIS_PORT":          "6379",
		"REDIS_USERNAME":      "default",
		"REDIS_PASSWORD":      "redis-pass",
		"JWT_SECRET":          "test-secret-key-for-testing-purposes-only-32chars",
		"PORT":                "8080",
		"JUDGE0_API_KEY":      "test-api-key",
		"JUDGE0_API_ENDPOINT": "https://test-judge0-api.com",
	}

	// 환경 변수 설정
	for key, value := range envVars {
		err := os.Setenv(key, value)
		require.NoError(t, err)
	}

	// cleanup 함수 반환
	return func() {
		for key := range envVars {
			os.Unsetenv(key)
		}
	}
}

func TestLoadConfig(t *testing.T) {
	cleanup := setupTestEnv(t)
	defer cleanup()

	cfg, err := LoadConfig()
	require.NoError(t, err)
	require.NotNil(t, cfg)

	// 데이터베이스 설정 검증
	assert.Equal(t, "test-host", cfg.DBHost)
	assert.Equal(t, "test-user", cfg.DBUser)
	assert.Equal(t, "test-password", cfg.DBPassword)
	assert.Equal(t, "test-db", cfg.DBName)
	assert.Equal(t, "5432", cfg.DBPort)

	// Redis 설정 검증
	assert.Equal(t, "redis-host", cfg.RedisHost)
	assert.Equal(t, "6379", cfg.RedisPort)
	assert.Equal(t, "default", cfg.RedisUsername)
	assert.Equal(t, "redis-pass", cfg.RedisPassword)

	// JWT 설정 검증
	assert.Equal(t, "test-secret-key-for-testing-purposes-only-32chars", cfg.JWTSecret)

	// 서버 설정 검증
	assert.Equal(t, "8080", cfg.ServerPort)

	// Judge0 API 설정 검증
	assert.Equal(t, "test-api-key", cfg.Judge0APIKey)
	assert.Equal(t, "https://test-judge0-api.com", cfg.Judge0APIEndpoint)
}

func TestLoadConfigMissingRequired(t *testing.T) {
	// 필수 환경 변수들을 제거한 상태에서 시작
	os.Clearenv()

	// 선택적 환경 변수만 설정
	optionalEnvVars := map[string]string{
		"DB_PORT":             "5432",
		"REDIS_PORT":          "6379",
		"REDIS_USERNAME":      "default",
		"REDIS_PASSWORD":      "",
		"PORT":                "8080",
		"JUDGE0_API_ENDPOINT": "https://judge0-ce.p.rapidapi.com",
	}

	for key, value := range optionalEnvVars {
		err := os.Setenv(key, value)
		require.NoError(t, err)
	}

	// LoadConfig 호출
	cfg, err := LoadConfig()

	// 에러가 발생해야 함
	require.Error(t, err)
	assert.Nil(t, cfg)

	// 에러 메시지에 필수 환경 변수들이 포함되어 있는지 확인
	requiredVars := []string{
		"DB_HOST",
		"DB_USER",
		"DB_PASSWORD",
		"DB_NAME",
		"REDIS_HOST",
		"JWT_SECRET",
		"JUDGE0_API_KEY",
	}

	for _, v := range requiredVars {
		assert.Contains(t, err.Error(), v)
	}
}

func TestLoadConfigOptionalDefaults(t *testing.T) {
	// 필수 환경 변수만 설정
	requiredEnvVars := map[string]string{
		"DB_HOST":        "test-host",
		"DB_USER":        "test-user",
		"DB_PASSWORD":    "test-password",
		"DB_NAME":        "test-db",
		"REDIS_HOST":     "redis-host",
		"JWT_SECRET":     "test-secret-key-for-testing-purposes-only-32chars",
		"JUDGE0_API_KEY": "test-api-key",
	}

	for key, value := range requiredEnvVars {
		err := os.Setenv(key, value)
		require.NoError(t, err)
	}

	cfg, err := LoadConfig()
	require.NoError(t, err)
	require.NotNil(t, cfg)

	// 선택적 환경 변수의 기본값 검증
	assert.Equal(t, "5432", cfg.DBPort)
	assert.Equal(t, "6379", cfg.RedisPort)
	assert.Equal(t, "default", cfg.RedisUsername)
	assert.Equal(t, "", cfg.RedisPassword)
	assert.Equal(t, "8080", cfg.ServerPort)
	assert.Equal(t, "https://judge0-ce.p.rapidapi.com", cfg.Judge0APIEndpoint)

	// cleanup
	for key := range requiredEnvVars {
		os.Unsetenv(key)
	}
}

func TestLoadConfigOverrideDefaults(t *testing.T) {
	cleanup := setupTestEnv(t)
	defer cleanup()

	// 기본값이 있는 환경 변수들의 값을 변경
	customValues := map[string]string{
		"DB_PORT":             "5433",
		"REDIS_PORT":          "6380",
		"REDIS_USERNAME":      "custom-user",
		"PORT":                "3000",
		"JUDGE0_API_ENDPOINT": "https://custom-judge0-api.com",
	}

	for key, value := range customValues {
		err := os.Setenv(key, value)
		require.NoError(t, err)
	}

	cfg, err := LoadConfig()
	require.NoError(t, err)
	require.NotNil(t, cfg)

	// 커스텀 값으로 덮어쓰기된 설정 검증
	assert.Equal(t, "5433", cfg.DBPort)
	assert.Equal(t, "6380", cfg.RedisPort)
	assert.Equal(t, "custom-user", cfg.RedisUsername)
	assert.Equal(t, "3000", cfg.ServerPort)
	assert.Equal(t, "https://custom-judge0-api.com", cfg.Judge0APIEndpoint)
}
