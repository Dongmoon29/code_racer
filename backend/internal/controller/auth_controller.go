package controller

import (
	"net/http"
	"os"

	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/util"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

type AuthController struct {
	authService interfaces.AuthService
	logger      logger.Logger
}

func NewAuthController(authService interfaces.AuthService, logger logger.Logger) *AuthController {
	return &AuthController{
		authService: authService,
		logger:      logger,
	}
}

func sendErrorResponse(ctx *gin.Context, statusCode int, message string) {
	ctx.JSON(statusCode, gin.H{
		"success": false,
		"message": message,
	})
}

func getOAuth2Config(provider string) *oauth2.Config {
	var config *oauth2.Config
	switch provider {
	case "google":
		config = &oauth2.Config{
			ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
			ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
			RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
			Scopes: []string{
				"https://www.googleapis.com/auth/userinfo.email",
				"https://www.googleapis.com/auth/userinfo.profile",
			},
			Endpoint: google.Endpoint,
		}
	case "github":
		config = &oauth2.Config{
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
	return config
}

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

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Login successful",
		"data": gin.H{
			"user":  response.User,
			"token": response.AccessToken,
		},
	})
}

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
	config := getOAuth2Config("google")
	if config == nil {
		sendErrorResponse(ctx, http.StatusInternalServerError, "Failed to get Google OAuth config")
		return
	}
	url := config.AuthCodeURL("state-token")
	ctx.Redirect(http.StatusTemporaryRedirect, url)
}

func (c *AuthController) GoogleCallback(ctx *gin.Context) {
	code := ctx.Query("code")
	if code == "" {
		sendErrorResponse(ctx, http.StatusBadRequest, "Authorization code not found")
		return
	}

	response, err := c.authService.LoginWithGoogle(code)
	if err != nil {
		sendErrorResponse(ctx, http.StatusUnauthorized, err.Error())
		return
	}

	frontendURL, err := util.GetenvRequired("FRONTEND_URL")
	if err != nil {
		sendErrorResponse(ctx, http.StatusInternalServerError, "Failed to get frontend URL")
		return
	}

	redirectURL := frontendURL + "/dashboard?token=" + response.AccessToken
	ctx.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

func (c *AuthController) GitHubAuthHandler(ctx *gin.Context) {
	state := uuid.New().String()

	config := getOAuth2Config("github")
	if config == nil {
		sendErrorResponse(ctx, http.StatusInternalServerError, "Failed to get GitHub OAuth config")
		return
	}
	url := config.AuthCodeURL(state)

	ctx.Redirect(http.StatusTemporaryRedirect, url)
}

func (c *AuthController) GitHubCallback(ctx *gin.Context) {
	code := ctx.Query("code")
	if code == "" {
		sendErrorResponse(ctx, http.StatusBadRequest, "Authorization code not found")
		return
	}

	response, err := c.authService.LoginWithGitHub(code)
	if err != nil {
		sendErrorResponse(ctx, http.StatusUnauthorized, err.Error())
		return
	}

	frontendURL, err := util.GetenvRequired("FRONTEND_URL")
	if err != nil {
		sendErrorResponse(ctx, http.StatusInternalServerError, "Failed to get frontend URL")
		return
	}

	redirectURL := frontendURL + "/dashboard?token=" + response.AccessToken
	ctx.Redirect(http.StatusTemporaryRedirect, redirectURL)
}

func (c *AuthController) Logout(ctx *gin.Context) {
	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Successfully logged out. Please remove the token from client storage.",
	})
}
