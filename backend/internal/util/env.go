package util

import (
	"fmt"
	"os"
)

// GetenvRequired 환경 변수를 가져오거나 에러를 반환합니다
func GetenvRequired(key string) (string, error) {
	value := os.Getenv(key)
	if value == "" {
		return "", fmt.Errorf("required environment variable %s is not set", key)
	}
	return value, nil
}

// GetEnvOptional 환경 변수를 가져오되, 없으면 빈 문자열을 반환합니다
func GetEnvOptionalWithDefault(key string, defaultString string) string {
	return os.Getenv(key)
}

func IsProduction() bool {
	return os.Getenv("GIN_MODE") == "release"
}
