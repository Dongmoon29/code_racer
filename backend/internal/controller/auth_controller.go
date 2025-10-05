package controller

import (
	"fmt"
	"net/http"
	"os"

	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

// OAuthConfigProvider provides OAuth configuration
type OAuthConfigProvider interface {
	GetGoogleConfig() *oauth2.Config
	GetGitHubConfig() *oauth2.Config
}

// AuthController handles authentication-related endpoints
// @Description Handles authentication-related endpoints including registration, login, OAuth
type AuthController struct {
	authService         interfaces.AuthService
	logger              logger.Logger
	oauthConfigProvider OAuthConfigProvider
}

func NewAuthController(authService interfaces.AuthService, logger logger.Logger, oauthConfigProvider OAuthConfigProvider) *AuthController {
	return &AuthController{
		authService:         authService,
		logger:              logger,
		oauthConfigProvider: oauthConfigProvider,
	}
}

func sendErrorResponse(ctx *gin.Context, statusCode int, message string) {
	ctx.JSON(statusCode, gin.H{
		"success": false,
		"message": message,
	})
}

// OAuthConfigProviderImpl implements OAuthConfigProvider using environment variables
type OAuthConfigProviderImpl struct{}

// NewOAuthConfigProvider creates a new OAuthConfigProvider instance
func NewOAuthConfigProvider() OAuthConfigProvider {
	return &OAuthConfigProviderImpl{}
}

// GetGoogleConfig returns Google OAuth configuration
func (p *OAuthConfigProviderImpl) GetGoogleConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		Endpoint: google.Endpoint,
	}
}

// GetGitHubConfig returns GitHub OAuth configuration
func (p *OAuthConfigProviderImpl) GetGitHubConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     os.Getenv("GH_CLIENT_ID"),
		ClientSecret: os.Getenv("GH_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GH_REDIRECT_URL"),
		Scopes: []string{
			"user:email",
			"read:user",
		},
		Endpoint: github.Endpoint,
	}
}

// Register godoc
// @Summary      User registration
// @Description  Register a new user to the system
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body model.RegisterRequest true "Registration request"
// @Success      201  {object}  map[string]interface{} "Registration successful"
// @Failure      400  {object}  map[string]interface{} "Bad request"
// @Failure      500  {object}  map[string]interface{} "Server error"
// @Router       /api/auth/register [post]
func (c *AuthController) Register(ctx *gin.Context) {
	var req model.RegisterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		sendErrorResponse(ctx, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	user, err := c.authService.Register(&req)
	if err != nil {
		sendErrorResponse(ctx, http.StatusBadRequest, err.Error())
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success": true,
		"user":    user,
	})
}

// Login godoc
// @Summary      User login
// @Description  Login with email and password
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request body model.LoginRequest true "Login request"
// @Success      200 {object} map[string]interface{} "Login successful"
// @Failure      400 {object} map[string]interface{} "Bad request"
// @Failure      401 {object} map[string]interface{} "Authentication failed"
// @Router       /api/auth/login [post]
func (c *AuthController) Login(ctx *gin.Context) {
	var req model.LoginRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		sendErrorResponse(ctx, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	response, err := c.authService.Login(&req)
	if err != nil {
		sendErrorResponse(ctx, http.StatusUnauthorized, err.Error())
		return
	}

	// Set httpOnly cookie for security (when same-origin)
	ctx.SetCookie("auth_token", response.AccessToken, 3600*24*7, "/", "", true, true) // 7 days, httpOnly, secure

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Login successful",
		"data": gin.H{
			"user":  response.User,
			"token": response.AccessToken, // Include token for cross-origin scenarios
		},
	})
}

// GetCurrentUser godoc
// @Summary      Get current user information
// @Description  Retrieve information about the currently logged in user
// @Tags         auth
// @Produce      json
// @Security     Bearer
// @Success      200 {object} map[string]interface{} "User information"
// @Failure      401 {object} map[string]interface{} "Authentication required"
// @Router       /api/auth/me [get]
func (c *AuthController) GetCurrentUser(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	if !exists {
		sendErrorResponse(ctx, http.StatusUnauthorized, "Unauthorized")
		return
	}

	user, err := c.authService.GetUserByID(userID.(uuid.UUID))
	if err != nil {
		sendErrorResponse(ctx, http.StatusInternalServerError, "Failed to get user information")
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"user":    user,
	})
}

func (c *AuthController) GoogleAuthHandler(ctx *gin.Context) {
	config := c.oauthConfigProvider.GetGoogleConfig()
	if config == nil {
		sendErrorResponse(ctx, http.StatusInternalServerError, "Failed to get Google OAuth config")
		return
	}
	url := config.AuthCodeURL("state-token")
	ctx.Redirect(http.StatusTemporaryRedirect, url)
}

// GoogleCallback Google OAuth 콜백 처리
func (c *AuthController) GoogleCallback(ctx *gin.Context) {
	c.logger.Info().Msg("Google OAuth callback: Starting callback processing")

	// Google이 리다이렉트로 전달한 인증 코드
	code := ctx.Query("code")
	if code == "" {
		c.logger.Error().Msg("Google OAuth callback: Authorization code not found")
		sendErrorResponse(ctx, http.StatusBadRequest, "Authorization code not found")
		return
	}

	// state 파라미터 확인 (CSRF 방지)
	state := ctx.Query("state")
	if state == "" {
		c.logger.Error().Msg("Google OAuth callback: State parameter not found")
		sendErrorResponse(ctx, http.StatusBadRequest, "State parameter not found")
		return
	}

	c.logger.Info().Str("code", code[:10]+"...").Msg("Google OAuth callback: Authorization code received")

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000" // 기본값
	}

	c.logger.Info().Str("frontend_url", frontendURL).Msg("Google OAuth callback: Frontend URL retrieved")

	// code와 state를 프론트엔드로 전달 (토큰 X)
	redirectURL := fmt.Sprintf("%s/auth/callback?code=%s&state=%s&provider=google", frontendURL, code, state)
	c.logger.Info().Str("redirect_url", redirectURL).Msg("Google OAuth callback: Redirecting to frontend")

	ctx.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

func (c *AuthController) GitHubAuthHandler(ctx *gin.Context) {
	state := uuid.New().String()

	config := c.oauthConfigProvider.GetGitHubConfig()
	if config == nil {
		sendErrorResponse(ctx, http.StatusInternalServerError, "Failed to get GitHub OAuth config")
		return
	}
	url := config.AuthCodeURL(state)

	ctx.Redirect(http.StatusTemporaryRedirect, url)
}

// GitHubCallback GitHub OAuth 콜백 처리
func (c *AuthController) GitHubCallback(ctx *gin.Context) {
	code := ctx.Query("code")
	if code == "" {
		c.logger.Error().Msg("GitHub OAuth callback: Authorization code not found")
		sendErrorResponse(ctx, http.StatusBadRequest, "Authorization code not found")
		return
	}

	// state 파라미터 확인 (CSRF 방지)
	state := ctx.Query("state")
	if state == "" {
		c.logger.Error().Msg("GitHub OAuth callback: State parameter not found")
		sendErrorResponse(ctx, http.StatusBadRequest, "State parameter not found")
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000" // 기본값
	}

	// code와 state를 프론트엔드로 전달 (토큰 X)
	redirectURL := fmt.Sprintf("%s/auth/callback?code=%s&state=%s&provider=github", frontendURL, code, state)
	ctx.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

// ExchangeToken OAuth 코드를 토큰으로 교환
func (c *AuthController) ExchangeToken(ctx *gin.Context) {
	var req struct {
		Code     string `json:"code" binding:"required"`
		State    string `json:"state" binding:"required"`
		Provider string `json:"provider" binding:"required"` // OAuth 제공자 명시
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		sendErrorResponse(ctx, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	c.logger.Info().Str("code", req.Code[:10]+"...").Str("provider", req.Provider).Msg("ExchangeToken: Processing token exchange")

	// state 검증 (CSRF 방지)
	if !c.validateState(req.State) {
		c.logger.Error().Msg("ExchangeToken: Invalid state parameter")
		sendErrorResponse(ctx, http.StatusBadRequest, "Invalid state parameter")
		return
	}

	// provider 검증
	if req.Provider != "google" && req.Provider != "github" {
		sendErrorResponse(ctx, http.StatusBadRequest, "Unsupported OAuth provider")
		return
	}

	var response *model.LoginResponse
	var err error

	switch req.Provider {
	case "google":
		response, err = c.authService.LoginWithGoogle(req.Code)
	case "github":
		response, err = c.authService.LoginWithGitHub(req.Code)
	default:
		sendErrorResponse(ctx, http.StatusBadRequest, "Unsupported OAuth provider")
		return
	}

	if err != nil {
		c.logger.Error().Err(err).Msg("ExchangeToken: OAuth login failed")
		sendErrorResponse(ctx, http.StatusUnauthorized, err.Error())
		return
	}

	c.logger.Info().Msg("ExchangeToken: Token exchange successful")

	// Set httpOnly cookie for security (when same-origin)
	ctx.SetCookie("auth_token", response.AccessToken, 3600*24*7, "/", "", true, true) // 7 days, httpOnly, secure

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"user":    response.User,
		"token":   response.AccessToken, // Include token for cross-origin scenarios
	})
}

// validateState state 파라미터 검증 (CSRF 방지)
func (c *AuthController) validateState(state string) bool {
	// 실제 구현에서는 Redis나 세션에 저장된 state와 비교
	// 현재는 간단한 검증만 수행
	return len(state) > 0 && len(state) < 100
}

func (c *AuthController) Logout(ctx *gin.Context) {
	// Clear the httpOnly cookie
	ctx.SetCookie("auth_token", "", -1, "/", "", true, true) // Expire immediately

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Successfully logged out",
	})
}
