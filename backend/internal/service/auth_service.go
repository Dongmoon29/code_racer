package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/Dongmoon29/code_racer/internal/apperr"
	"github.com/Dongmoon29/code_racer/internal/config"
	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/types"
	"github.com/Dongmoon29/code_racer/internal/util"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"gorm.io/gorm"
)

var _ interfaces.AuthService = (*authService)(nil)

type authService struct {
	userRepo    interfaces.UserRepository
	jwtSecret   string
	tokenExpiry time.Duration
	logger      logger.Logger
	oauthConfig *config.OAuthConfig
}

// NewAuthService creates a new AuthService instance with the provided dependencies
func NewAuthService(userRepo interfaces.UserRepository, jwtSecret string, oauthConfig *config.OAuthConfig, logger logger.Logger) interfaces.AuthService {
	return &authService{
		userRepo:    userRepo,
		jwtSecret:   jwtSecret,
		tokenExpiry: constants.TokenExpiryDays * 24 * time.Hour,
		logger:      logger,
		oauthConfig: oauthConfig,
	}
}

func (s *authService) Register(req *model.RegisterRequest) (*model.UserResponse, error) {
	hashedPassword, err := util.HashPassword(req.Password)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to process password")
	}

	user := &model.User{
		Email:    req.Email,
		Password: hashedPassword,
		Name:     req.Name,
		Role:     model.RoleUser, // Set default role to 'user'
	}

	// Save user
	if err := s.userRepo.Create(user); err != nil {
		// Repository returns a sentinel string error for existing email.
		if err.Error() == "email already exists" {
			return nil, apperr.Wrap(err, apperr.CodeConflict, "Email already exists")
		}
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to create user")
	}

	return user.ToResponse(), nil
}

// Login login service
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
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.New(apperr.CodeUnauthorized, "Invalid email or password")
		}
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to login")
	}

	// Password verification
	if !util.CheckPasswordHash(req.Password, user.Password) {
		return nil, apperr.New(apperr.CodeUnauthorized, "Invalid email or password")
	}

	// Update last login time
	now := time.Now()
	user.LastLoginAt = &now
	if err := s.userRepo.Update(user); err != nil {
		s.logger.Warn().
			Err(err).
			Str("user_id", user.ID.String()).
			Msg("Failed to update last_login_at")
		// Don't fail login if we can't update last_login_at
	}

	// JWT token generation
	token, err := s.generateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to generate access token")
	}

	return &model.LoginResponse{
		User:        user.ToResponse(),
		AccessToken: token,
	}, nil
}

// ValidateToken JWT token validation
func (s *authService) ValidateToken(tokenString string) (*types.JWTClaims, error) {
	// JWT token validation
	token, err := jwt.ParseWithClaims(tokenString, &types.JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtSecret), nil
	})

	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeUnauthorized, "Invalid token")
	}

	if claims, ok := token.Claims.(*types.JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, apperr.New(apperr.CodeUnauthorized, "Invalid token")
}

func (s *authService) GetUserByID(id uuid.UUID) (*model.UserResponse, error) {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.Wrap(err, apperr.CodeNotFound, "User not found")
		}
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to load user")
	}

	return user.ToResponse(), nil
}

func (s *authService) generateToken(userID uuid.UUID, email string, role string) (string, error) {
	claims := &types.JWTClaims{
		UserID: userID.String(),
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.tokenExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	signedToken, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return "", err
	}

	return signedToken, nil
}

func (s *authService) LoginWithGoogle(code string) (*model.LoginResponse, error) {
	if s.oauthConfig == nil || s.oauthConfig.Google == nil {
		return nil, apperr.New(apperr.CodeInternal, "Google OAuth is not configured")
	}
	token, err := s.exchangeGoogleCode(code)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeUpstreamUnavailable, "Google OAuth token exchange failed")
	}

	googleUser, err := s.getGoogleUserInfo(token.AccessToken)
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeUpstreamUnavailable, "Failed to fetch Google user info")
	}

	user, err := s.userRepo.FindByEmail(googleUser.Email)
	now := time.Now()
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to load user")
		}
		// User doesn't exist, create new OAuth user
		user = &model.User{
			Email:         googleUser.Email,
			Name:          googleUser.Name,
			ProfileImage:  googleUser.Picture,
			Role:          model.RoleUser,
			OAuthProvider: "google",
			OAuthID:       googleUser.ID,
			LastLoginAt:   &now,
		}
		if err := s.userRepo.Create(user); err != nil {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to create user")
		}
	} else {
		// User exists - check if it's an OAuth account or regular account
		user.LastLoginAt = &now
		switch user.OAuthProvider {
		case "":
			// Regular account exists - link OAuth account
			user.OAuthProvider = "google"
			user.OAuthID = googleUser.ID
			user.ProfileImage = googleUser.Picture
			if err := s.userRepo.Update(user); err != nil {
				return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to link OAuth account")
			}
		case "google":
			// Same OAuth provider - update profile image
			user.ProfileImage = googleUser.Picture
			if err := s.userRepo.Update(user); err != nil {
				return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to update user")
			}
		default:
			// Different OAuth provider - return error
			return nil, apperr.New(apperr.CodeConflict, "Email is already registered with a different OAuth provider")
		}
	}

	jwtToken, err := s.generateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to generate access token")
	}

	return &model.LoginResponse{
		User:        user.ToResponse(),
		AccessToken: jwtToken,
	}, nil
}

func (s *authService) exchangeGoogleCode(code string) (*oauth2.Token, error) {
	return s.oauthConfig.Google.Exchange(context.Background(), code)
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

func (s *authService) LoginWithGitHub(code string) (*model.LoginResponse, error) {
	if s.oauthConfig == nil || s.oauthConfig.GitHub == nil {
		return nil, apperr.New(apperr.CodeInternal, "GitHub OAuth is not configured")
	}
	token, err := s.exchangeGitHubCode(code)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to exchange GitHub code")
		return nil, apperr.Wrap(err, apperr.CodeUpstreamUnavailable, "GitHub OAuth token exchange failed")
	}

	githubUser, err := s.getGitHubUserInfo(token.AccessToken)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to get GitHub user info")
		return nil, apperr.Wrap(err, apperr.CodeUpstreamUnavailable, "Failed to fetch GitHub user info")
	}

	user, err := s.userRepo.FindByEmail(githubUser.Email)
	now := time.Now()
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to load user")
		}
		// User doesn't exist, create new OAuth user
		user = &model.User{
			ID:            uuid.New(),
			Email:         githubUser.Email,
			Name:          githubUser.Name,
			ProfileImage:  githubUser.AvatarURL,
			Role:          model.RoleUser,
			OAuthProvider: "github",
			OAuthID:       githubUser.ID,
			LastLoginAt:   &now,
		}
		if err := s.userRepo.Create(user); err != nil {
			s.logger.Error().Err(err).Msg("Failed to create new user")
			return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to create user")
		}
	} else {
		// User exists - check if it's an OAuth account or regular account
		user.LastLoginAt = &now
		switch user.OAuthProvider {
		case "":
			// Regular account exists - link OAuth account
			user.OAuthProvider = "github"
			user.OAuthID = githubUser.ID
			user.ProfileImage = githubUser.AvatarURL
			if err := s.userRepo.Update(user); err != nil {
				s.logger.Error().Err(err).Msg("Failed to link OAuth account")
				return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to link OAuth account")
			}
		case "github":
			// Same OAuth provider - update profile image
			user.ProfileImage = githubUser.AvatarURL
			if err := s.userRepo.Update(user); err != nil {
				s.logger.Error().Err(err).Msg("Failed to update user profile image")
				return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to update user")
			}
		default:
			// Different OAuth provider - return error
			return nil, apperr.New(apperr.CodeConflict, "Email is already registered with a different OAuth provider")
		}
	}

	jwtToken, err := s.generateToken(user.ID, user.Email, string(user.Role))
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to generate JWT token")
		return nil, apperr.Wrap(err, apperr.CodeInternal, "Failed to generate access token")
	}

	return &model.LoginResponse{
		User:        user.ToResponse(),
		AccessToken: jwtToken,
	}, nil
}

func (s *authService) exchangeGitHubCode(code string) (*oauth2.Token, error) {
	return s.oauthConfig.GitHub.Exchange(context.Background(), code)
}

func (s *authService) getGitHubUserInfo(accessToken string) (*model.GitHubUser, error) {
	httpClient := oauth2.NewClient(context.Background(), oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: accessToken},
	))

	emailResp, err := httpClient.Get("https://api.github.com/user/emails")
	if err != nil {
		return nil, fmt.Errorf("GitHub API email error: %w", err)
	}
	defer emailResp.Body.Close()

	var emails []struct {
		Email    string `json:"email"`
		Primary  bool   `json:"primary"`
		Verified bool   `json:"verified"`
	}
	if err := json.NewDecoder(emailResp.Body).Decode(&emails); err != nil {
		return nil, fmt.Errorf("failed to decode GitHub email response: %w", err)
	}

	var primaryEmail string
	for _, email := range emails {
		if email.Primary && email.Verified {
			primaryEmail = email.Email
			break
		}
	}

	if primaryEmail == "" {
		return nil, fmt.Errorf("no verified primary email found")
	}

	userResp, err := httpClient.Get("https://api.github.com/user")
	if err != nil {
		return nil, fmt.Errorf("GitHub API error: %w", err)
	}
	defer userResp.Body.Close()

	var githubUser struct {
		ID        int64  `json:"id"`
		Login     string `json:"login"`
		Name      string `json:"name"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := json.NewDecoder(userResp.Body).Decode(&githubUser); err != nil {
		return nil, fmt.Errorf("failed to decode GitHub user response: %w", err)
	}

	name := githubUser.Name
	if name == "" {
		name = githubUser.Login
	}

	return &model.GitHubUser{
		ID:        strconv.FormatInt(githubUser.ID, 10),
		Email:     primaryEmail,
		Name:      name,
		AvatarURL: githubUser.AvatarURL,
	}, nil
}
