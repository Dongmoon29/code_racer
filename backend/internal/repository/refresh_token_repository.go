package repository

import (
	"errors"
	"time"

	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrRefreshTokenInvalid    = errors.New("refresh token is invalid")
	ErrRefreshTokenExpired    = errors.New("refresh token has expired")
	ErrRefreshTokenReused     = errors.New("refresh token reuse detected")
	ErrRefreshTokenConcurrent = errors.New("refresh token was rotated concurrently")
)

const refreshRotationGracePeriod = 5 * time.Second

type refreshTokenRepository struct {
	db *gorm.DB
}

func NewRefreshTokenRepository(db *gorm.DB) interfaces.RefreshTokenRepository {
	return &refreshTokenRepository{db: db}
}

func (r *refreshTokenRepository) Create(token *model.RefreshToken) error {
	return r.db.Create(token).Error
}

func (r *refreshTokenRepository) Rotate(currentHash string, replacementHash string, now time.Time) (*model.RefreshToken, error) {
	var replacement *model.RefreshToken
	var outcomeErr error

	err := r.db.Transaction(func(tx *gorm.DB) error {
		var current model.RefreshToken
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("token_hash = ?", currentHash).
			First(&current).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			outcomeErr = ErrRefreshTokenInvalid
			return nil
		}
		if err != nil {
			return err
		}

		if current.RevokedAt != nil {
			if current.ReplacedByHash != "" && now.Sub(*current.RevokedAt) <= refreshRotationGracePeriod {
				outcomeErr = ErrRefreshTokenConcurrent
				return nil
			}
			if err := revokeRefreshTokenFamily(tx, current.FamilyID, now); err != nil {
				return err
			}
			outcomeErr = ErrRefreshTokenReused
			return nil
		}
		if !now.Before(current.ExpiresAt) {
			if err := tx.Model(&current).Update("revoked_at", now).Error; err != nil {
				return err
			}
			outcomeErr = ErrRefreshTokenExpired
			return nil
		}

		if err := tx.Model(&current).Updates(map[string]interface{}{
			"revoked_at":       now,
			"replaced_by_hash": replacementHash,
		}).Error; err != nil {
			return err
		}

		replacement = &model.RefreshToken{
			UserID:    current.UserID,
			TokenHash: replacementHash,
			FamilyID:  current.FamilyID,
			ExpiresAt: current.ExpiresAt,
		}
		return tx.Create(replacement).Error
	})
	if err != nil {
		return nil, err
	}
	if outcomeErr != nil {
		return nil, outcomeErr
	}
	return replacement, nil
}

func (r *refreshTokenRepository) RevokeFamilyByHash(tokenHash string, now time.Time) error {
	var token model.RefreshToken
	if err := r.db.Where("token_hash = ?", tokenHash).First(&token).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return err
	}
	return revokeRefreshTokenFamily(r.db, token.FamilyID, now)
}

func revokeRefreshTokenFamily(db *gorm.DB, familyID uuid.UUID, now time.Time) error {
	return db.Model(&model.RefreshToken{}).
		Where("family_id = ? AND revoked_at IS NULL", familyID).
		Update("revoked_at", now).Error
}
