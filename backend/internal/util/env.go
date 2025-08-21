package util

import (
	"fmt"
	"os"
	"strings"
)

// GetenvRequired 환경 변수를 가져오거나 에러를 반환합니다
func GetenvRequired(key string) (string, error) {
	value := os.Getenv(key)
	if value == "" {
		return "", fmt.Errorf("required environment variable %s is not set", key)
	}
	return value, nil
}

// GetEnv retrieves an environment variable or returns a default value
func GetEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// GetCORSAllowedOrigins returns a list of CORS allowed origins
func GetCORSAllowedOrigins() []string {
	// Default origins
	defaultOrigins := []string{"http://localhost:3000", "http://localhost:3001"}

	// Get frontend URL from environment variable
	frontendURL := GetEnv("FRONTEND_URL", "")
	if frontendURL != "" {
		defaultOrigins = append(defaultOrigins, frontendURL)
	}

	// Additional CORS allowed origins (comma-separated)
	additionalOrigins := GetEnv("CORS_ALLOWED_ORIGINS", "")
	if additionalOrigins != "" {
		origins := strings.Split(additionalOrigins, ",")
		for _, origin := range origins {
			origin = strings.TrimSpace(origin)
			if origin != "" {
				defaultOrigins = append(defaultOrigins, origin)
			}
		}
	}

	return defaultOrigins
}

func IsProduction() bool {
	return os.Getenv("GIN_MODE") == "release"
}
