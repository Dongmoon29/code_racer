package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// RefreshToken stores only a SHA-256 digest of the browser credential.
// Tokens in the same family belong to one login session and can be revoked
// together if reuse of a rotated token is detected.
type RefreshToken struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID         uuid.UUID `gorm:"type:uuid;not null;index"`
	TokenHash      string    `gorm:"type:char(64);uniqueIndex;not null"`
	FamilyID       uuid.UUID `gorm:"type:uuid;not null;index"`
	ExpiresAt      time.Time `gorm:"not null;index"`
	RevokedAt      *time.Time
	ReplacedByHash string `gorm:"type:char(64)"`
	CreatedAt      time.Time
	User           User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

func (t *RefreshToken) BeforeCreate(_ *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	if t.FamilyID == uuid.Nil {
		t.FamilyID = uuid.New()
	}
	return nil
}
