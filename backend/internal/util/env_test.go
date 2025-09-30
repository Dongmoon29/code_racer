package util

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGetenvRequired_ExistingEnvVar_ReturnsValue(t *testing.T) {
	// Given
	key := "TEST_ENV_VAR"
	expectedValue := "test_value"
	os.Setenv(key, expectedValue)
	defer os.Unsetenv(key)

	// When
	value, err := GetenvRequired(key)

	// Then
	assert.NoError(t, err)
	assert.Equal(t, expectedValue, value)
}

func TestGetenvRequired_MissingEnvVar_ReturnsError(t *testing.T) {
	// Given
	key := "NON_EXISTENT_ENV_VAR"
	os.Unsetenv(key)

	// When
	value, err := GetenvRequired(key)

	// Then
	assert.Error(t, err)
	assert.Empty(t, value)
	assert.Contains(t, err.Error(), "required environment variable")
}

func TestGetEnv_ExistingEnvVar_ReturnsValue(t *testing.T) {
	// Given
	key := "TEST_ENV_VAR"
	expectedValue := "test_value"
	os.Setenv(key, expectedValue)
	defer os.Unsetenv(key)

	// When
	value := GetEnv(key, "default")

	// Then
	assert.Equal(t, expectedValue, value)
}

func TestGetEnv_MissingEnvVar_ReturnsDefault(t *testing.T) {
	// Given
	key := "NON_EXISTENT_ENV_VAR"
	defaultValue := "default_value"
	os.Unsetenv(key)

	// When
	value := GetEnv(key, defaultValue)

	// Then
	assert.Equal(t, defaultValue, value)
}

func TestGetCORSAllowedOrigins_ValidEnvVar_ReturnsOrigins(t *testing.T) {
	// Given
	key := "CORS_ALLOWED_ORIGINS"
	expectedOrigins := []string{"http://localhost:3000", "http://localhost:3001", "https://example.com"}
	os.Setenv(key, "https://example.com")
	defer os.Unsetenv(key)

	// When
	origins := GetCORSAllowedOrigins()

	// Then
	assert.Equal(t, expectedOrigins, origins)
}

func TestGetCORSAllowedOrigins_MissingEnvVar_ReturnsDefault(t *testing.T) {
	// Given
	key := "CORS_ALLOWED_ORIGINS"
	os.Unsetenv(key)

	// When
	origins := GetCORSAllowedOrigins()

	// Then
	expectedOrigins := []string{"http://localhost:3000", "http://localhost:3001"}
	assert.Equal(t, expectedOrigins, origins)
}

func TestIsProduction_ProductionEnv_ReturnsTrue(t *testing.T) {
	// Given
	key := "GIN_MODE"
	os.Setenv(key, "release")
	defer os.Unsetenv(key)

	// When
	isProd := IsProduction()

	// Then
	assert.True(t, isProd)
}

func TestIsProduction_DevelopmentEnv_ReturnsFalse(t *testing.T) {
	// Given
	key := "GIN_MODE"
	os.Setenv(key, "debug")
	defer os.Unsetenv(key)

	// When
	isProd := IsProduction()

	// Then
	assert.False(t, isProd)
}

func TestIsProduction_MissingEnvVar_ReturnsFalse(t *testing.T) {
	// Given
	key := "GIN_MODE"
	os.Unsetenv(key)

	// When
	isProd := IsProduction()

	// Then
	assert.False(t, isProd)
}

// 테이블 드리븐 테스트
func TestIsProduction_TableDriven(t *testing.T) {
	tests := []struct {
		name     string
		envValue string
		expected bool
	}{
		{
			name:     "release",
			envValue: "release",
			expected: true,
		},
		{
			name:     "debug",
			envValue: "debug",
			expected: false,
		},
		{
			name:     "test",
			envValue: "test",
			expected: false,
		},
		{
			name:     "empty",
			envValue: "",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			key := "GIN_MODE"
			os.Setenv(key, tt.envValue)
			defer os.Unsetenv(key)

			// When
			result := IsProduction()

			// Then
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestGetEnv_TableDriven(t *testing.T) {
	tests := []struct {
		name         string
		key          string
		defaultValue string
		envValue     string
		expected     string
	}{
		{
			name:         "existing env var",
			key:          "TEST_VAR",
			defaultValue: "default",
			envValue:     "env_value",
			expected:     "env_value",
		},
		{
			name:         "missing env var",
			key:          "MISSING_VAR",
			defaultValue: "default",
			envValue:     "",
			expected:     "default",
		},
		{
			name:         "empty env var",
			key:          "EMPTY_VAR",
			defaultValue: "default",
			envValue:     "",
			expected:     "default",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			if tt.envValue != "" {
				os.Setenv(tt.key, tt.envValue)
				defer os.Unsetenv(tt.key)
			} else {
				os.Unsetenv(tt.key)
			}

			// When
			result := GetEnv(tt.key, tt.defaultValue)

			// Then
			assert.Equal(t, tt.expected, result)
		})
	}
}
