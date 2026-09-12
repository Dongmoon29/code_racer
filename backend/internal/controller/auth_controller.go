package controller

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/Dongmoon29/code_racer/internal/apperr"
	"github.com/Dongmoon29/code_racer/internal/config"
	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/util"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
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

// OAuthConfigProviderImpl implements OAuthConfigProvider using centralized config
type OAuthConfigProviderImpl struct {
	oauthConfig *config.OAuthConfig
}

// NewOAuthConfigProvider creates a new OAuthConfigProvider instance
func NewOAuthConfigProvider(oauthConfig *config.OAuthConfig) OAuthConfigProvider {
	return &OAuthConfigProviderImpl{
		oauthConfig: oauthConfig,
	}
}

// GetGoogleConfig returns Google OAuth configuration
func (p *OAuthConfigProviderImpl) GetGoogleConfig() *oauth2.Config {
	if p == nil || p.oauthConfig == nil {
		return nil
	}
	return p.oauthConfig.Google
}

// GetGitHubConfig returns GitHub OAuth configuration
func (p *OAuthConfigProviderImpl) GetGitHubConfig() *oauth2.Config {
	if p == nil || p.oauthConfig == nil {
		return nil
	}
	return p.oauthConfig.GitHub
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
		BadRequest(ctx, "Invalid request: "+err.Error())
		return
	}

	user, err := c.authService.Register(&req)
	if err != nil {
		WriteError(ctx, err)
		return
	}

	Created(ctx, user)
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
		BadRequest(ctx, "Invalid request: "+err.Error())
		return
	}

	response, err := c.authService.Login(&req)
	if err != nil {
		WriteError(ctx, err)
		return
	}

	c.writeLoginResponse(ctx, response, http.StatusOK, "Login successful")
}

func (c *AuthController) writeLoginResponse(ctx *gin.Context, response *model.LoginResponse, status int, message string) {
	c.setRefreshCookie(ctx, response.RefreshToken, response.RefreshTokenExpiresAt)
	ctx.Header("Cache-Control", "no-store")
	ctx.JSON(status, gin.H{
		"success": true,
		"message": message,
		"data": gin.H{
			"user":  response.User,
			"token": response.AccessToken,
		},
	})
}

func (c *AuthController) setRefreshCookie(ctx *gin.Context, token string, expiresAt time.Time) {
	name, path, secure := refreshCookieSettings(ctx)
	http.SetCookie(ctx.Writer, &http.Cookie{
		Name:     name,
		Value:    token,
		Path:     path,
		MaxAge:   max(0, int(time.Until(expiresAt).Seconds())),
		Expires:  expiresAt,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})
}

func (c *AuthController) clearRefreshCookie(ctx *gin.Context) {
	name, path, secure := refreshCookieSettings(ctx)
	http.SetCookie(ctx.Writer, &http.Cookie{
		Name:     name,
		Value:    "",
		Path:     path,
		MaxAge:   -1,
		Expires:  time.Unix(1, 0),
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})
}

func refreshCookieSettings(ctx *gin.Context) (name string, path string, secure bool) {
	secure = util.IsProduction() || ctx.Request.TLS != nil || strings.EqualFold(ctx.GetHeader("X-Forwarded-Proto"), "https")
	if secure {
		return constants.SecureRefreshTokenCookieName, "/", true
	}
	return constants.RefreshTokenCookieName, "/api/auth", false
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
		Unauthorized(ctx, "Unauthorized")
		return
	}

	user, err := c.authService.GetUserByID(userID.(uuid.UUID))
	if err != nil {
		WriteError(ctx, err)
		return
	}

	OK(ctx, user)
}

func (c *AuthController) GoogleAuthHandler(ctx *gin.Context) {
	state := uuid.New().String()

	config := c.oauthConfigProvider.GetGoogleConfig()
	if config == nil {
		InternalError(ctx, "Failed to get Google OAuth config")
		return
	}
	// Add prompt=select_account to always show account selection page
	// This prevents automatic login when user is already logged into Google
	url := config.AuthCodeURL(state, oauth2.SetAuthURLParam("prompt", "select_account"))
	ctx.Redirect(http.StatusTemporaryRedirect, url)
}

// GoogleCallback Google OAuth
func (c *AuthController) GoogleCallback(ctx *gin.Context) {
	c.logger.Info().Msg("Google OAuth callback: Starting callback processing")

	code := ctx.Query("code")
	if code == "" {
		c.logger.Error().Msg("Google OAuth callback: Authorization code not found")
		BadRequest(ctx, "Authorization code not found")
		return
	}

	state := ctx.Query("state")
	if state == "" {
		c.logger.Error().Msg("Google OAuth callback: State parameter not found")
		BadRequest(ctx, "State parameter not found")
		return
	}

	c.logger.Info().Str("code", util.MaskCode(code)).Msg("Google OAuth callback: Authorization code received")

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	c.logger.Info().Str("frontend_url", frontendURL).Msg("Google OAuth callback: Frontend URL retrieved")

	redirectURL := fmt.Sprintf("%s/auth/callback?code=%s&state=%s&provider=google", frontendURL, code, state)
	c.logger.Info().Str("redirect_url", redirectURL).Msg("Google OAuth callback: Redirecting to frontend")

	ctx.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

func (c *AuthController) GitHubAuthHandler(ctx *gin.Context) {
	state := uuid.New().String()

	config := c.oauthConfigProvider.GetGitHubConfig()
	if config == nil {
		InternalError(ctx, "Failed to get GitHub OAuth config")
		return
	}
	url := config.AuthCodeURL(state)

	ctx.Redirect(http.StatusTemporaryRedirect, url)
}

// GitHubCallback GitHub OAuth
func (c *AuthController) GitHubCallback(ctx *gin.Context) {
	code := ctx.Query("code")
	if code == "" {
		c.logger.Error().Msg("GitHub OAuth callback: Authorization code not found")
		BadRequest(ctx, "Authorization code not found")
		return
	}

	state := ctx.Query("state")
	if state == "" {
		c.logger.Error().Msg("GitHub OAuth callback: State parameter not found")
		BadRequest(ctx, "State parameter not found")
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	redirectURL := fmt.Sprintf("%s/auth/callback?code=%s&state=%s&provider=github", frontendURL, code, state)
	ctx.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

func (c *AuthController) ExchangeToken(ctx *gin.Context) {
	var req struct {
		Code     string `json:"code" binding:"required"`
		State    string `json:"state" binding:"required"`
		Provider string `json:"provider" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		BadRequest(ctx, "Invalid request: "+err.Error())
		return
	}

	c.logger.Info().Str("code", util.MaskCode(req.Code)).Str("provider", req.Provider).Msg("ExchangeToken: Processing token exchange")

	if !c.validateState(req.State) {
		c.logger.Error().Msg("ExchangeToken: Invalid state parameter")
		BadRequest(ctx, "Invalid state parameter")
		return
	}

	if req.Provider != "google" && req.Provider != "github" {
		BadRequest(ctx, "Unsupported OAuth provider")
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
		BadRequest(ctx, "Unsupported OAuth provider")
		return
	}

	if err != nil {
		c.logger.Error().Err(err).Msg("ExchangeToken: OAuth login failed")
		WriteError(ctx, err)
		return
	}

	c.logger.Info().Msg("ExchangeToken: Token exchange successful")

	c.writeLoginResponse(ctx, response, http.StatusOK, "Token exchange successful")
}

func (c *AuthController) validateState(state string) bool {
	// Basic validation: check length and format
	// For production, consider implementing CSRF token validation with Redis/session storage
	if len(state) == 0 || len(state) > 100 {
		return false
	}
	// Basic format check: should contain alphanumeric characters, hyphens, or underscores
	// This prevents basic injection attempts
	for _, char := range state {
		if !((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') ||
			(char >= '0' && char <= '9') || char == '-' || char == '_') {
			return false
		}
	}
	return true
}

func (c *AuthController) Logout(ctx *gin.Context) {
	name, _, _ := refreshCookieSettings(ctx)
	refreshToken, _ := ctx.Cookie(name)
	err := c.authService.Logout(refreshToken)
	c.clearRefreshCookie(ctx)
	if err != nil {
		WriteError(ctx, err)
		return
	}
	JSONMessage(ctx, http.StatusOK, "Successfully logged out")
}

func (c *AuthController) Refresh(ctx *gin.Context) {
	name, _, _ := refreshCookieSettings(ctx)
	refreshToken, err := ctx.Cookie(name)
	if err != nil {
		c.clearRefreshCookie(ctx)
		Unauthorized(ctx, "Login session has expired")
		return
	}
	response, err := c.authService.RefreshSession(refreshToken)
	if err != nil {
		if appError, ok := apperr.As(err); !ok || appError.Code != apperr.CodeConflict {
			c.clearRefreshCookie(ctx)
		} else {
			ctx.Header("Retry-After", "1")
		}
		WriteError(ctx, err)
		return
	}
	c.writeLoginResponse(ctx, response, http.StatusOK, "Session refreshed")
}
