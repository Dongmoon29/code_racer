package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role string

const (
	RoleUser  Role = "user"
	RoleAdmin Role = "admin"
)

type User struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Email         string    `gorm:"type:varchar(255);unique;not null" json:"email"`
	Password      string    `gorm:"type:varchar(255)" json:"-"`
	Name          string    `gorm:"type:varchar(255);not null" json:"name"`
	ProfileImage  string    `gorm:"type:varchar(255)" json:"profile_image"`
	Role          Role      `gorm:"type:varchar(20);default:'user'" json:"role"`
	OAuthProvider string    `gorm:"type:varchar(20)" json:"oauth_provider,omitempty"`
	OAuthID       string    `gorm:"type:varchar(255)" json:"oauth_id,omitempty"`
	Homepage      string    `gorm:"type:varchar(255)" json:"homepage"`
	LinkedIn      string    `gorm:"type:varchar(255)" json:"linkedin"`
	GitHub        string    `gorm:"type:varchar(255)" json:"github"`
	Company       string    `gorm:"type:varchar(255)" json:"company"`
	JobTitle      string    `gorm:"type:varchar(255)" json:"job_title"`
	FavLanguage   string    `gorm:"type:varchar(50)" json:"fav_language"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	Rating        int       `gorm:"type:integer;default:1000" json:"rating"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

type UserResponse struct {
	ID            uuid.UUID `json:"id"`
	Email         string    `json:"email"`
	Name          string    `json:"name"`
	ProfileImage  string    `json:"profile_image"`
	Role          Role      `json:"role"`
	OAuthProvider string    `json:"oauth_provider,omitempty"`
	OAuthID       string    `json:"oauth_id,omitempty"`
	Homepage      string    `json:"homepage,omitempty"`
	LinkedIn      string    `json:"linkedin,omitempty"`
	GitHub        string    `json:"github,omitempty"`
	Company       string    `json:"company,omitempty"`
	JobTitle      string    `json:"job_title,omitempty"`
	FavLanguage   string    `json:"fav_language,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

func (u *User) ToResponse() *UserResponse {
	return &UserResponse{
		ID:            u.ID,
		Email:         u.Email,
		Name:          u.Name,
		ProfileImage:  u.ProfileImage,
		Role:          u.Role,
		OAuthProvider: u.OAuthProvider,
		OAuthID:       u.OAuthID,
		Homepage:      u.Homepage,
		LinkedIn:      u.LinkedIn,
		GitHub:        u.GitHub,
		Company:       u.Company,
		JobTitle:      u.JobTitle,
		FavLanguage:   u.FavLanguage,
		CreatedAt:     u.CreatedAt,
	}
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required,min=2,max=100"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	User        *UserResponse `json:"user"`
	AccessToken string        `json:"access_token"`
}

type UpdateProfileRequest struct {
	Homepage    string `json:"homepage" binding:"omitempty,url"`
	LinkedIn    string `json:"linkedin" binding:"omitempty,url"`
	GitHub      string `json:"github" binding:"omitempty,url"`
	Company     string `json:"company" binding:"omitempty,max=255"`
	JobTitle    string `json:"job_title" binding:"omitempty,max=255"`
	FavLanguage string `json:"fav_language" binding:"omitempty,oneof=javascript python go java cpp rust"`
}

type GitHubUser struct {
	ID        string
	Email     string
	Name      string
	AvatarURL string
}
