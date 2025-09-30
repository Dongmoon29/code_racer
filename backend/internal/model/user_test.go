package model

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestUser_BeforeCreate_SetsID(t *testing.T) {
	// Given
	user := &User{
		Email:    "test@example.com",
		Name:     "Test User",
		Password: "hashedpassword",
	}

	// When
	err := user.BeforeCreate(nil)

	// Then
	assert.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, user.ID)
}

func TestUser_BeforeCreate_ExistingID_KeepsID(t *testing.T) {
	// Given
	existingID := uuid.New()
	user := &User{
		ID:       existingID,
		Email:    "test@example.com",
		Name:     "Test User",
		Password: "hashedpassword",
	}

	// When
	err := user.BeforeCreate(nil)

	// Then
	assert.NoError(t, err)
	assert.Equal(t, existingID, user.ID)
}

func TestUser_ToResponse_ReturnsUserResponse(t *testing.T) {
	// Given
	user := &User{
		ID:            uuid.New(),
		Email:         "test@example.com",
		Name:          "Test User",
		ProfileImage:  "profile.jpg",
		Role:          RoleUser,
		OAuthProvider: "google",
		OAuthID:       "oauth123",
		Homepage:      "https://example.com",
		LinkedIn:      "https://linkedin.com/in/test",
		GitHub:        "https://github.com/test",
		Company:       "Test Company",
		JobTitle:      "Software Engineer",
		FavLanguage:   "go",
	}

	// When
	response := user.ToResponse()

	// Then
	assert.NotNil(t, response)
	assert.Equal(t, user.ID, response.ID)
	assert.Equal(t, user.Email, response.Email)
	assert.Equal(t, user.Name, response.Name)
	assert.Equal(t, user.ProfileImage, response.ProfileImage)
	assert.Equal(t, user.Role, response.Role)
	assert.Equal(t, user.OAuthProvider, response.OAuthProvider)
	assert.Equal(t, user.OAuthID, response.OAuthID)
	assert.Equal(t, user.Homepage, response.Homepage)
	assert.Equal(t, user.LinkedIn, response.LinkedIn)
	assert.Equal(t, user.GitHub, response.GitHub)
	assert.Equal(t, user.Company, response.Company)
	assert.Equal(t, user.JobTitle, response.JobTitle)
	assert.Equal(t, user.FavLanguage, response.FavLanguage)
}

func TestUser_ToResponse_EmptyFields_ReturnsEmptyResponse(t *testing.T) {
	// Given
	user := &User{
		ID:    uuid.New(),
		Email: "test@example.com",
		Name:  "Test User",
		Role:  RoleUser,
	}

	// When
	response := user.ToResponse()

	// Then
	assert.NotNil(t, response)
	assert.Equal(t, user.ID, response.ID)
	assert.Equal(t, user.Email, response.Email)
	assert.Equal(t, user.Name, response.Name)
	assert.Equal(t, user.Role, response.Role)
	assert.Empty(t, response.ProfileImage)
	assert.Empty(t, response.OAuthProvider)
	assert.Empty(t, response.OAuthID)
	assert.Empty(t, response.Homepage)
	assert.Empty(t, response.LinkedIn)
	assert.Empty(t, response.GitHub)
	assert.Empty(t, response.Company)
	assert.Empty(t, response.JobTitle)
	assert.Empty(t, response.FavLanguage)
}

// 테이블 드리븐 테스트
func TestUser_BeforeCreate_TableDriven(t *testing.T) {
	tests := []struct {
		name        string
		user        *User
		expectError bool
	}{
		{
			name: "user with nil ID",
			user: &User{
				ID:       uuid.Nil,
				Email:    "test@example.com",
				Name:     "Test User",
				Password: "hashedpassword",
			},
			expectError: false,
		},
		{
			name: "user with existing ID",
			user: &User{
				ID:       uuid.New(),
				Email:    "test@example.com",
				Name:     "Test User",
				Password: "hashedpassword",
			},
			expectError: false,
		},
		{
			name: "user with empty email",
			user: &User{
				ID:       uuid.Nil,
				Email:    "",
				Name:     "Test User",
				Password: "hashedpassword",
			},
			expectError: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			originalID := tt.user.ID

			// When
			err := tt.user.BeforeCreate(nil)

			// Then
			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				if originalID == uuid.Nil {
					assert.NotEqual(t, uuid.Nil, tt.user.ID)
				} else {
					assert.Equal(t, originalID, tt.user.ID)
				}
			}
		})
	}
}

func TestUser_ToResponse_TableDriven(t *testing.T) {
	tests := []struct {
		name     string
		user     *User
		expected *UserResponse
	}{
		{
			name: "complete user",
			user: &User{
				ID:            uuid.New(),
				Email:         "test@example.com",
				Name:          "Test User",
				ProfileImage:  "profile.jpg",
				Role:          RoleAdmin,
				OAuthProvider: "github",
				OAuthID:       "github123",
				Homepage:      "https://example.com",
				LinkedIn:      "https://linkedin.com/in/test",
				GitHub:        "https://github.com/test",
				Company:       "Test Company",
				JobTitle:      "Software Engineer",
				FavLanguage:   "javascript",
			},
			expected: &UserResponse{
				Email:         "test@example.com",
				Name:          "Test User",
				ProfileImage:  "profile.jpg",
				Role:          RoleAdmin,
				OAuthProvider: "github",
				OAuthID:       "github123",
				Homepage:      "https://example.com",
				LinkedIn:      "https://linkedin.com/in/test",
				GitHub:        "https://github.com/test",
				Company:       "Test Company",
				JobTitle:      "Software Engineer",
				FavLanguage:   "javascript",
			},
		},
		{
			name: "minimal user",
			user: &User{
				ID:    uuid.New(),
				Email: "minimal@example.com",
				Name:  "Minimal User",
				Role:  RoleUser,
			},
			expected: &UserResponse{
				Email: "minimal@example.com",
				Name:  "Minimal User",
				Role:  RoleUser,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// When
			result := tt.user.ToResponse()

			// Then
			assert.NotNil(t, result)
			assert.Equal(t, tt.user.ID, result.ID)
			assert.Equal(t, tt.expected.Email, result.Email)
			assert.Equal(t, tt.expected.Name, result.Name)
			assert.Equal(t, tt.expected.ProfileImage, result.ProfileImage)
			assert.Equal(t, tt.expected.Role, result.Role)
			assert.Equal(t, tt.expected.OAuthProvider, result.OAuthProvider)
			assert.Equal(t, tt.expected.OAuthID, result.OAuthID)
			assert.Equal(t, tt.expected.Homepage, result.Homepage)
			assert.Equal(t, tt.expected.LinkedIn, result.LinkedIn)
			assert.Equal(t, tt.expected.GitHub, result.GitHub)
			assert.Equal(t, tt.expected.Company, result.Company)
			assert.Equal(t, tt.expected.JobTitle, result.JobTitle)
			assert.Equal(t, tt.expected.FavLanguage, result.FavLanguage)
		})
	}
}
