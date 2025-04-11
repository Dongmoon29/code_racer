package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User 사용자 정보를 담는 모델
type User struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	Email         string    `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	Password      string    `gorm:"type:varchar(255)" json:"-"` // OAuth 사용자는 비밀번호가 없을 수 있으므로 not null 제거
	Name          string    `gorm:"type:varchar(100);not null" json:"name"`
	OAuthProvider string    `gorm:"type:varchar(20)" json:"oauth_provider"` // 'google', 'github' 등
	OAuthID       string    `gorm:"type:varchar(255)" json:"oauth_id"`      // OAuth 제공자의 사용자 ID
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// BeforeCreate UUID 생성을 위한 GORM 훅
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// UserResponse 사용자 정보 응답 DTO도 OAuth 필드 추가
type UserResponse struct {
	ID            uuid.UUID `json:"id"`
	Email         string    `json:"email"`
	Name          string    `json:"name"`
	OAuthProvider string    `json:"oauth_provider,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

// ToResponse User 모델을 UserResponse DTO로 변환
func (u *User) ToResponse() *UserResponse {
	return &UserResponse{
		ID:            u.ID,
		Email:         u.Email,
		Name:          u.Name,
		OAuthProvider: u.OAuthProvider,
		CreatedAt:     u.CreatedAt,
	}
}

// RegisterRequest 회원가입 요청 DTO
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required,min=2,max=100"`
}

// LoginRequest 로그인 요청 DTO
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse 로그인 응답 DTO
type LoginResponse struct {
	User        *UserResponse `json:"user"`
	AccessToken string        `json:"access_token"`
}
