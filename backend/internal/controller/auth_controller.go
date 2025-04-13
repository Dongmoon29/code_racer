package controller

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

// AuthController 인증 관련 컨트롤러
type AuthController struct {
	authService service.AuthService
	logger      logger.Logger
}

// NewAuthController AuthController 인스턴스 생성
func NewAuthController(authService service.AuthService, logger logger.Logger) *AuthController {
	return &AuthController{
		authService: authService,
		logger:      logger,
	}
}

// Register 회원가입 핸들러
func (c *AuthController) Register(ctx *gin.Context) {
	var req model.RegisterRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request: " + err.Error(),
		})
		return
	}

	user, err := c.authService.Register(&req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
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
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request: " + err.Error(),
		})
		return
	}

	response, err := c.authService.Login(&req)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// HTTP-only 쿠키 설정 추가
	ctx.SetCookie(
		"authToken",
		response.AccessToken,
		3600*24*30, // 30일
		"/",
		"",
		true, // Secure
		true, // HTTP-only
	)

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
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	user, err := c.authService.GetUserByID(userID.(uuid.UUID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get user information",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"user":    user,
	})
}

func (c *AuthController) GoogleLogin(ctx *gin.Context) {
	var req model.GoogleAuthRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request",
		})
		return
	}

	response, err := c.authService.LoginWithGoogle(req.Code)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":      true,
		"user":         response.User,
		"access_token": response.AccessToken,
	})
}

// GoogleAuthHandler Google 로그인 페이지로 리다이렉트
func (c *AuthController) GoogleAuthHandler(ctx *gin.Context) {
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

	// 환경변수 확인을 위한 로깅 추가
	log.Printf("ClientID: %s, RedirectURL: %s", config.ClientID, config.RedirectURL)

	url := config.AuthCodeURL("state-token")
	ctx.Redirect(http.StatusTemporaryRedirect, url)
}

// GoogleCallback Google OAuth 콜백 처리
func (c *AuthController) GoogleCallback(ctx *gin.Context) {
	// Google이 리다이렉트로 전달한 인증 코드
	code := ctx.Query("code")
	if code == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Authorization code not found",
		})
		return
	}

	response, err := c.authService.LoginWithGoogle(code)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// HTTP-only 쿠키 설정
	ctx.SetCookie(
		"authToken",
		response.AccessToken,
		3600*24*30, // 30일
		"/",
		"",
		true, // Secure
		true, // HTTP-only
	)

	frontendURL := os.Getenv("FRONTEND_URL")
	ctx.Redirect(http.StatusTemporaryRedirect, frontendURL+"/dashboard")
}

// GitHubAuthHandler GitHub 로그인 페이지로 리다이렉트
func (c *AuthController) GitHubAuthHandler(ctx *gin.Context) {
	// state 파라미터 추가 (CSRF 방지)
	state := uuid.New().String()

	config := &oauth2.Config{
		ClientID:     os.Getenv("GH_CLIENT_ID"),
		ClientSecret: os.Getenv("GH_CLIENT_SECRET"),
		RedirectURL:  os.Getenv("GH_REDIRECT_URL"),
		Scopes: []string{
			"user:email",
			"read:user", // 사용자 정보 읽기 권한 추가
		},
		Endpoint: github.Endpoint,
	}

	// 디버깅을 위한 로깅 추가
	c.logger.Info().
		Str("clientID", config.ClientID).
		Str("redirectURL", config.RedirectURL).
		Msg("GitHub OAuth configuration")

	url := config.AuthCodeURL(state)

	// 리다이렉트 전에 로깅
	c.logger.Info().
		Str("redirectURL", url).
		Msg("Redirecting to GitHub OAuth page")

	ctx.Redirect(http.StatusTemporaryRedirect, url)
}

// GitHubCallback GitHub OAuth 콜백 처리
func (c *AuthController) GitHubCallback(ctx *gin.Context) {
	code := ctx.Query("code")
	if code == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Authorization code not found",
		})
		return
	}

	response, err := c.authService.LoginWithGitHub(code)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	ctx.Redirect(http.StatusTemporaryRedirect,
		fmt.Sprintf("%s/auth/callback?token=%s", frontendURL, response.AccessToken))
}
