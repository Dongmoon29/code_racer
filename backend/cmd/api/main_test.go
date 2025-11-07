package main

import (
	"os"
	"testing"
	"time"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMain(m *testing.M) {
	// 테스트 모드로 설정
	gin.SetMode(gin.TestMode)

	// 테스트 실행
	code := m.Run()

	os.Exit(code)
}

func TestIsProduction(t *testing.T) {
	tests := []struct {
		name     string
		mode     string
		expected bool
	}{
		{
			name:     "production mode",
			mode:     gin.ReleaseMode,
			expected: true,
		},
		{
			name:     "development mode",
			mode:     gin.DebugMode,
			expected: false,
		},
		{
			name:     "test mode",
			mode:     gin.TestMode,
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gin.SetMode(tt.mode)
			assert.Equal(t, tt.expected, isProduction())
		})
	}
}

func TestStartServer(t *testing.T) {
	// 테스트용 라우터 설정
	router := gin.New()
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// 테스트용 포트
	testPort := "8082"
	
	// 테스트용 logger 생성
	testLogger := logger.NewZerologLogger(zerolog.Nop())

	// 서버 시작을 고루틴으로 실행
	go func() {
		startServer(router, testPort, nil, nil, nil, testLogger)
	}()

	// 서버가 시작될 때까지 잠시 대기
	time.Sleep(100 * time.Millisecond)

	// 서버 종료 시그널 전송
	p, err := os.FindProcess(os.Getpid())
	require.NoError(t, err)
	require.NoError(t, p.Signal(os.Interrupt))
}
