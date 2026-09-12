package repository

import (
	"errors"
	"testing"
	"time"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupRefreshTokenRepository(t *testing.T) (*gorm.DB, *refreshTokenRepository, model.User) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&model.User{}, &model.RefreshToken{}))
	user := model.User{Email: "session@example.com", Name: "Session User"}
	require.NoError(t, db.Create(&user).Error)
	return db, &refreshTokenRepository{db: db}, user
}

func TestRefreshTokenRepository_RotatesAndDetectsReuse(t *testing.T) {
	db, repo, user := setupRefreshTokenRepository(t)
	now := time.Now().UTC().Truncate(time.Millisecond)
	original := &model.RefreshToken{
		UserID:    user.ID,
		TokenHash: "original",
		ExpiresAt: now.Add(24 * time.Hour),
	}
	require.NoError(t, repo.Create(original))

	replacement, err := repo.Rotate("original", "replacement", now)
	require.NoError(t, err)
	assert.Equal(t, user.ID, replacement.UserID)
	assert.Equal(t, original.FamilyID, replacement.FamilyID)
	assert.WithinDuration(t, original.ExpiresAt, replacement.ExpiresAt, time.Millisecond)

	var persistedOriginal model.RefreshToken
	require.NoError(t, db.First(&persistedOriginal, "token_hash = ?", "original").Error)
	assert.NotNil(t, persistedOriginal.RevokedAt)
	assert.Equal(t, "replacement", persistedOriginal.ReplacedByHash)

	_, err = repo.Rotate("original", "concurrent", now.Add(time.Second))
	assert.True(t, errors.Is(err, ErrRefreshTokenConcurrent))

	var activeReplacement model.RefreshToken
	require.NoError(t, db.First(&activeReplacement, "token_hash = ?", "replacement").Error)
	assert.Nil(t, activeReplacement.RevokedAt)

	_, err = repo.Rotate("original", "attacker", now.Add(refreshRotationGracePeriod+time.Second))
	assert.True(t, errors.Is(err, ErrRefreshTokenReused))

	require.NoError(t, db.First(&activeReplacement, "token_hash = ?", "replacement").Error)
	assert.NotNil(t, activeReplacement.RevokedAt, "reuse must revoke the active token family")
}

func TestRefreshTokenRepository_RejectsExpiredToken(t *testing.T) {
	_, repo, user := setupRefreshTokenRepository(t)
	now := time.Now().UTC()
	require.NoError(t, repo.Create(&model.RefreshToken{
		UserID:    user.ID,
		TokenHash: "expired",
		ExpiresAt: now.Add(-time.Minute),
	}))

	_, err := repo.Rotate("expired", "replacement", now)
	assert.True(t, errors.Is(err, ErrRefreshTokenExpired))
}
