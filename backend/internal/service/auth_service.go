package service

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"time"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/repository"
	"github.com/Dongmoon29/code_racer/internal/util"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// JWTClaims JWT 토큰에 포함될 클레임
type JWTClaims struct {
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
	jwt.RegisteredClaims
}

// AuthService 인증 관련 기능을 제공하는 인터페이스
type AuthService interface {
	Register(req *model.RegisterRequest) (*model.UserResponse, error)
	Login(req *model.LoginRequest) (*model.LoginResponse, error)
	ValidateToken(tokenString string) (*JWTClaims, error)
	GetUserByID(id uuid.UUID) (*model.UserResponse, error)
	LoginWithGoogle(code string) (*model.LoginResponse, error)
}

// authService AuthService 인터페이스 구현체
type authService struct {
	userRepo    repository.UserRepository
	jwtSecret   string
	tokenExpiry time.Duration
	logger      logger.Logger
}

// NewAuthService AuthService 인스턴스 생성
func NewAuthService(userRepo repository.UserRepository, jwtSecret string, logger logger.Logger) AuthService {
	return &authService{
		userRepo:    userRepo,
		jwtSecret:   jwtSecret,
		tokenExpiry: 24 * time.Hour, // 토큰 만료 시간 (24시간)
		logger:      logger,
	}
}

// Register 회원가입 서비스
func (s *authService) Register(req *model.RegisterRequest) (*model.UserResponse, error) {
	// 패스워드 해싱
	hashedPassword, err := util.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// 새 사용자 생성
	user := &model.User{
		Email:    req.Email,
		Password: hashedPassword,
		Name:     req.Name,
	}

	// 사용자 저장
	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	return user.ToResponse(), nil
}

// Login 로그인 서비스
func (s *authService) Login(req *model.LoginRequest) (*model.LoginResponse, error) {
	s.logger.Debug().
		Str("email", req.Email).
		Msg("Attempting login")

	user, err := s.userRepo.FindByEmail(req.Email)
	if err != nil {
		s.logger.Error().
			Str("email", req.Email).
			Err(err).
			Msg("Login failed")
		return nil, errors.New("invalid email or password")
	}

	// 패스워드 검증
	if !util.CheckPasswordHash(req.Password, user.Password) {
		return nil, errors.New("invalid email or password")
	}

	// JWT 토큰 생성
	token, err := s.generateToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &model.LoginResponse{
		User:        user.ToResponse(),
		AccessToken: token,
	}, nil
}

// ValidateToken JWT 토큰 검증
func (s *authService) ValidateToken(tokenString string) (*JWTClaims, error) {
	// JWT 토큰 검증
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

// GetUserByID 사용자 ID로 사용자 정보 조회
func (s *authService) GetUserByID(id uuid.UUID) (*model.UserResponse, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	return user.ToResponse(), nil
}

// generateToken JWT 토큰 생성
func (s *authService) generateToken(userID uuid.UUID, email string) (string, error) {
	// 클레임 설정
	claims := &JWTClaims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.tokenExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	// 토큰 생성
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// 토큰에 서명
	signedToken, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return "", err
	}

	return signedToken, nil
}

func (s *authService) LoginWithGoogle(code string) (*model.LoginResponse, error) {
	// Google OAuth 토큰 교환
	token, err := s.exchangeGoogleCode(code)
	if err != nil {
		return nil, err
	}

	// Google 사용자 정보 가져오기
	googleUser, err := s.getGoogleUserInfo(token.AccessToken)
	if err != nil {
		return nil, err
	}

	// 기존 사용자 확인 또는 새 사용자 생성
	user, err := s.userRepo.FindByEmail(googleUser.Email)
	if err != nil {
		// 새 사용자 생성
		user = &model.User{
			Email:         googleUser.Email,
			Name:          googleUser.Name,
			OAuthProvider: "google",
			OAuthID:       googleUser.ID,
		}
		if err := s.userRepo.Create(user); err != nil {
			return nil, err
		}
	}

	// JWT 토큰 생성
	jwtToken, err := s.generateToken(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &model.LoginResponse{
		User:        user.ToResponse(),
		AccessToken: jwtToken,
	}, nil
}

func (s *authService) exchangeGoogleCode(code string) (*oauth2.Token, error) {
	config := &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}

	return config.Exchange(context.Background(), code)
}

func (s *authService) getGoogleUserInfo(accessToken string) (*model.GoogleUser, error) {
	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var googleUser model.GoogleUser
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		return nil, err
	}

	return &googleUser, nil
}
