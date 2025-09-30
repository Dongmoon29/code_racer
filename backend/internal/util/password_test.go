package util

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHashPassword_ValidPassword_ReturnsHash(t *testing.T) {
	// Given
	password := "testpassword123"

	// When
	hash, err := HashPassword(password)

	// Then
	assert.NoError(t, err)
	assert.NotEmpty(t, hash)
	assert.NotEqual(t, password, hash)
}

func TestHashPassword_EmptyPassword_ReturnsHash(t *testing.T) {
	// Given
	password := ""

	// When
	hash, err := HashPassword(password)

	// Then
	assert.NoError(t, err)
	assert.NotEmpty(t, hash)
}

func TestCheckPasswordHash_ValidPassword_ReturnsTrue(t *testing.T) {
	// Given
	password := "testpassword123"
	hash, err := HashPassword(password)
	assert.NoError(t, err)

	// When
	isValid := CheckPasswordHash(password, hash)

	// Then
	assert.True(t, isValid)
}

func TestCheckPasswordHash_InvalidPassword_ReturnsFalse(t *testing.T) {
	// Given
	password := "testpassword123"
	wrongPassword := "wrongpassword"
	hash, err := HashPassword(password)
	assert.NoError(t, err)

	// When
	isValid := CheckPasswordHash(wrongPassword, hash)

	// Then
	assert.False(t, isValid)
}

func TestCheckPasswordHash_EmptyPassword_ReturnsFalse(t *testing.T) {
	// Given
	password := "testpassword123"
	hash, err := HashPassword(password)
	assert.NoError(t, err)

	// When
	isValid := CheckPasswordHash("", hash)

	// Then
	assert.False(t, isValid)
}

func TestCheckPasswordHash_EmptyHash_ReturnsFalse(t *testing.T) {
	// Given
	password := "testpassword123"

	// When
	isValid := CheckPasswordHash(password, "")

	// Then
	assert.False(t, isValid)
}

// 테이블 드리븐 테스트
func TestPasswordHashing_TableDriven(t *testing.T) {
	tests := []struct {
		name     string
		password string
		valid    bool
	}{
		{
			name:     "valid password",
			password: "password123",
			valid:    true,
		},
		{
			name:     "password with special chars",
			password: "p@ssw0rd!@#",
			valid:    true,
		},
		{
			name:     "long password",
			password: "verylongpasswordthatshouldworkfine123456789",
			valid:    true,
		},
		{
			name:     "empty password",
			password: "",
			valid:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			password := tt.password

			// When
			hash, err := HashPassword(password)

			// Then
			if tt.valid {
				assert.NoError(t, err)
				assert.NotEmpty(t, hash)
				assert.NotEqual(t, password, hash)

				// Verify the hash can be checked
				isValid := CheckPasswordHash(password, hash)
				assert.True(t, isValid)
			} else {
				assert.Error(t, err)
				assert.Empty(t, hash)
			}
		})
	}
}
