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

// AuthController 인증 관련 컨트롤러
type AuthController struct {
	authService interfaces.AuthService
	logger      logger.Logger
}

// NewAuthController AuthController 인스턴스 생성
func NewAuthController(authService interfaces.AuthService, logger logger.Logger) *AuthController {
	return &AuthController{
		authService: authService,
		logger:      logger,
	}
}

// sendErrorResponse 오류 응답을 통일하여 처리
func sendErrorResponse(ctx *gin.Context, statusCode int, message string) {
	ctx.JSON(statusCode, gin.H{
		"success": false,
		"message": message,
	})
}

// setAuthCookie 인증 쿠키 설정
func setAuthCookie(ctx *gin.Context, accessToken, domain string) {
	ctx.SetSameSite(http.SameSiteNoneMode)
	ctx.SetCookie(
		"authToken",
		accessToken,
		3600*24*30, // 30일
		"/",
		domain,
		true,
		true,
	)
}

// getOAuth2Config OAuth2 설정을 가져오는 함수
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

// Register 회원가입 핸들러
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

// Login 로그인 핸들러
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

	frontendDomain, err := util.GetenvRequired("FRONTEND_DOMAIN")
	if err != nil {
		sendErrorResponse(ctx, http.StatusInternalServerError, "Failed to get frontend URL")
		return
	}

	setAuthCookie(ctx, response.AccessToken, frontendDomain)

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"user":    response.User,
	})
}

// GetCurrentUser 현재 로그인된 사용자 정보 조회 핸들러
func (c *AuthController) GetCurrentUser(ctx *gin.Context) {
	// userID는 미들웨어에서 설정됨
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

// GoogleAuthHandler Google 로그인 페이지로 리다이렉트
func (c *AuthController) GoogleAuthHandler(ctx *gin.Context) {
	config := getOAuth2Config("google")
	if config == nil {
		sendErrorResponse(ctx, http.StatusInternalServerError, "Failed to get Google OAuth config")
		return
	}
	url := config.AuthCodeURL("state-token")
	ctx.Redirect(http.StatusTemporaryRedirect, url)
}

// GoogleCallback Google OAuth 콜백 처리
func (c *AuthController) GoogleCallback(ctx *gin.Context) {
	// Google이 리다이렉트로 전달한 인증 코드
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

	frontendDomain, err := util.GetenvRequired("FRONTEND_DOMAIN")
	if err != nil {
		sendErrorResponse(ctx, http.StatusInternalServerError, "Failed to get frontend domain")
		return
	}
	frontendURL, err := util.GetenvRequired("FRONTEND_URL")
	if err != nil {
		sendErrorResponse(ctx, http.StatusInternalServerError, "Failed to get frontend URL")
		return
	}

	setAuthCookie(ctx, response.AccessToken, frontendDomain)

	ctx.Redirect(http.StatusTemporaryRedirect, frontendURL+"/dashboard")
}

// GitHubAuthHandler GitHub 로그인 페이지로 리다이렉트
func (c *AuthController) GitHubAuthHandler(ctx *gin.Context) {
	// state 파라미터 추가 (CSRF 방지)
	state := uuid.New().String()

	config := getOAuth2Config("github")
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
		sendErrorResponse(ctx, http.StatusBadRequest, "Authorization code not found")
		return
	}

	response, err := c.authService.LoginWithGitHub(code)
	if err != nil {
		sendErrorResponse(ctx, http.StatusUnauthorized, err.Error())
		return
	}

	frontendDomain, err := util.GetenvRequired("FRONTEND_DOMAIN")
	if err != nil {
		sendErrorResponse(ctx, http.StatusInternalServerError, "Failed to get frontend domain")
		return
	}
	frontendURL, err := util.GetenvRequired("FRONTEND_URL")
	if err != nil {
		sendErrorResponse(ctx, http.StatusInternalServerError, "Failed to get frontend URL")
		return
	}

	setAuthCookie(ctx, response.AccessToken, frontendDomain)

	// 토큰을 URL 파라미터로 전달하지 않고 대시보드로 직접 리다이렉트
	ctx.Redirect(http.StatusTemporaryRedirect, frontendURL+"/dashboard")
}

// Logout 로그아웃 핸들러
func (c *AuthController) Logout(ctx *gin.Context) {

	// 쿠키를 만료시켜 삭제
	ctx.SetCookie(
		"authToken",
		"", // 빈 값
		-1, // 즉시 만료
		"/",
		"",
		true,
		true,
	)

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Successfully logged out",
	})
}
