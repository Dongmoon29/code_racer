package repository

import (
	"io"
	"testing"
	"time"

	appLogger "github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func newUserRepositoryTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(
		&model.User{},
		&model.RefreshToken{},
		&model.ActiveMatchParticipant{},
	))
	return db
}

func TestUserRepositoryDeactivateAnonymizesUserAndRevokesSessions(t *testing.T) {
	db := newUserRepositoryTestDB(t)
	repo := NewUserRepository(db, appLogger.NewZerologLogger(zerolog.New(io.Discard)))
	user := model.User{
		Email:         "member@example.com",
		Password:      "hash",
		Name:          "Member",
		ProfileImage:  "https://example.com/avatar.png",
		OAuthProvider: "google",
		OAuthID:       "oauth-id",
		GitHub:        "https://github.com/member",
	}
	require.NoError(t, db.Create(&user).Error)
	token := model.RefreshToken{
		UserID:    user.ID,
		TokenHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		ExpiresAt: time.Now().Add(time.Hour),
	}
	require.NoError(t, db.Create(&token).Error)

	deactivatedAt := time.Now().UTC().Truncate(time.Millisecond)
	require.NoError(t, repo.Deactivate(user.ID, deactivatedAt))

	var got model.User
	require.NoError(t, db.First(&got, "id = ?", user.ID).Error)
	assert.Equal(t, model.AccountStatusDeactivated, got.AccountStatus)
	assert.Equal(t, "Deleted User", got.Name)
	assert.Equal(t, "deleted+"+user.ID.String()+"@coderacer.invalid", got.Email)
	assert.Empty(t, got.Password)
	assert.Empty(t, got.OAuthID)
	assert.Empty(t, got.GitHub)
	assert.NotNil(t, got.DeactivatedAt)

	var gotToken model.RefreshToken
	require.NoError(t, db.First(&gotToken, "id = ?", token.ID).Error)
	assert.NotNil(t, gotToken.RevokedAt)
}

func TestUserRepositoryDeactivateRejectsActiveMatch(t *testing.T) {
	db := newUserRepositoryTestDB(t)
	repo := NewUserRepository(db, appLogger.NewZerologLogger(zerolog.New(io.Discard)))
	user := model.User{Email: "playing@example.com", Name: "Player"}
	require.NoError(t, db.Create(&user).Error)
	require.NoError(t, db.Create(&model.ActiveMatchParticipant{
		UserID:  user.ID,
		MatchID: uuid.New(),
	}).Error)

	err := repo.Deactivate(user.ID, time.Now().UTC())
	require.ErrorIs(t, err, ErrUserHasActiveMatch)

	var got model.User
	require.NoError(t, db.First(&got, "id = ?", user.ID).Error)
	assert.True(t, got.IsActive())
	assert.Equal(t, "playing@example.com", got.Email)
}

func TestUserRepositoryDeactivateRejectsAdmin(t *testing.T) {
	db := newUserRepositoryTestDB(t)
	repo := NewUserRepository(db, appLogger.NewZerologLogger(zerolog.New(io.Discard)))
	user := model.User{
		Email: "admin@example.com",
		Name:  "Admin",
		Role:  model.RoleAdmin,
	}
	require.NoError(t, db.Create(&user).Error)

	err := repo.Deactivate(user.ID, time.Now().UTC())
	require.ErrorIs(t, err, ErrAdminDeactivation)

	var got model.User
	require.NoError(t, db.First(&got, "id = ?", user.ID).Error)
	assert.True(t, got.IsActive())
	assert.Equal(t, model.RoleAdmin, got.Role)
}
