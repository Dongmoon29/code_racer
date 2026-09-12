package interfaces

import (
	"time"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/types"
	"github.com/google/uuid"
)

type AuthService interface {
	Register(req *model.RegisterRequest) (*model.UserResponse, error)
	Login(req *model.LoginRequest) (*model.LoginResponse, error)
	ValidateToken(tokenString string) (*types.JWTClaims, error)
	GetUserByID(id uuid.UUID) (*model.UserResponse, error)
	LoginWithGoogle(code string) (*model.LoginResponse, error)
	LoginWithGitHub(code string) (*model.LoginResponse, error)
	RefreshSession(refreshToken string) (*model.LoginResponse, error)
	Logout(refreshToken string) error
}

type RefreshTokenRepository interface {
	Create(token *model.RefreshToken) error
	Rotate(currentHash string, replacementHash string, now time.Time) (*model.RefreshToken, error)
	RevokeFamilyByHash(tokenHash string, now time.Time) error
}
