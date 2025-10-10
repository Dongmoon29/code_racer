package judge

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/Dongmoon29/code_racer/internal/types"
)

// Judge0Client는 Judge0 API와의 통신을 담당하는 개선된 클라이언트입니다
type Judge0Client struct {
	apiKey      string
	apiEndpoint string
	httpClient  *http.Client
	rateLimiter *RateLimiter
	mutex       sync.RWMutex
}

// RateLimiter는 API 호출 제한을 관리합니다
type RateLimiter struct {
	tokens chan struct{}
	ticker *time.Ticker
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(rate int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		tokens: make(chan struct{}, rate),
		ticker: time.NewTicker(window),
	}
	
	// Fill initial tokens
	for i := 0; i < rate; i++ {
		rl.tokens <- struct{}{}
	}
	
	// Refill tokens periodically
	go func() {
		for range rl.ticker.C {
			select {
			case rl.tokens <- struct{}{}:
			default:
			}
		}
	}()
	
	return rl
}

// Acquire acquires a token for API call
func (rl *RateLimiter) Acquire() {
	<-rl.tokens
}

// Close stops the rate limiter
func (rl *RateLimiter) Close() {
	rl.ticker.Stop()
}

// Judge0Config는 Judge0 클라이언트 설정을 담습니다
type Judge0Config struct {
	APIKey      string
	APIEndpoint string
	Timeout     time.Duration
	RateLimit   int           // requests per window
	Window      time.Duration // rate limit window
	RetryCount  int           // number of retries on failure
	RetryDelay  time.Duration // delay between retries
}

// DefaultJudge0Config returns default configuration
func DefaultJudge0Config(apiKey, apiEndpoint string) *Judge0Config {
	return &Judge0Config{
		APIKey:      apiKey,
		APIEndpoint: apiEndpoint,
		Timeout:     30 * time.Second,
		RateLimit:   100, // 100 requests per minute
		Window:      time.Minute,
		RetryCount:  3,
		RetryDelay:  time.Second,
	}
}

// NewJudge0Client creates a new improved Judge0Client
func NewJudge0Client(config *Judge0Config) *Judge0Client {
	return &Judge0Client{
		apiKey:      config.APIKey,
		apiEndpoint: config.APIEndpoint,
		httpClient: &http.Client{
			Timeout: config.Timeout,
		},
		rateLimiter: NewRateLimiter(config.RateLimit, config.Window),
	}
}

// SubmitCode Judge0 API에 코드를 제출하고 결과를 반환합니다 (개선된 버전)
func (c *Judge0Client) SubmitCode(ctx context.Context, req types.Judge0Request) (*types.Judge0Response, error) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	
	// Rate limiting
	c.rateLimiter.Acquire()
	
	// Request validation
	if err := c.validateRequest(req); err != nil {
		return nil, fmt.Errorf("invalid request: %w", err)
	}
	
	// Retry logic
	var lastErr error
	for attempt := 0; attempt < 3; attempt++ {
		if attempt > 0 {
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(time.Second * time.Duration(attempt)):
			}
		}
		
		resp, err := c.executeRequest(ctx, req)
		if err == nil {
			return resp, nil
		}
		
		lastErr = err
		
		// Don't retry on certain errors
		if c.isNonRetryableError(err) {
			break
		}
	}
	
	return nil, fmt.Errorf("judge0 API failed after retries: %w", lastErr)
}

// validateRequest validates the Judge0 request
func (c *Judge0Client) validateRequest(req types.Judge0Request) error {
	if req.SourceCode == "" {
		return fmt.Errorf("source code cannot be empty")
	}
	if req.LanguageID <= 0 {
		return fmt.Errorf("invalid language ID: %d", req.LanguageID)
	}
	if req.CompileTimeout <= 0 {
		return fmt.Errorf("invalid compile timeout: %d", req.CompileTimeout)
	}
	if req.RunTimeout <= 0 {
		return fmt.Errorf("invalid run timeout: %d", req.RunTimeout)
	}
	return nil
}

// executeRequest executes a single Judge0 API request
func (c *Judge0Client) executeRequest(ctx context.Context, req types.Judge0Request) (*types.Judge0Response, error) {
	// 요청 데이터 직렬화
	reqBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// API 요청 생성
	request, err := http.NewRequestWithContext(
		ctx,
		"POST",
		fmt.Sprintf("%s/submissions?wait=true", c.apiEndpoint),
		bytes.NewBuffer(reqBody),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// 헤더 설정
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-RapidAPI-Key", c.apiKey)
	if parsed, perr := url.Parse(c.apiEndpoint); perr == nil {
		if parsed.Host != "" {
			request.Header.Set("X-RapidAPI-Host", parsed.Host)
		}
	}

	// API 요청 실행
	resp, err := c.httpClient.Do(request)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	// 응답 바디 읽기
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// 응답 상태 코드 확인
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("judge0 API error (status %d): %s", resp.StatusCode, string(body))
	}

	// 응답 파싱
	var result types.Judge0Response
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	return &result, nil
}

// isNonRetryableError checks if an error should not be retried
func (c *Judge0Client) isNonRetryableError(err error) bool {
	errStr := err.Error()
	// Don't retry on authentication errors, quota exceeded, or invalid requests
	return containsAny(errStr, []string{
		"401", "403", "quota exceeded", "invalid request",
		"compilation error", "syntax error",
	})
}

// containsAny checks if a string contains any of the substrings
func containsAny(s string, substrings []string) bool {
	for _, substr := range substrings {
		if len(s) >= len(substr) {
			for i := 0; i <= len(s)-len(substr); i++ {
				if s[i:i+len(substr)] == substr {
					return true
				}
			}
		}
	}
	return false
}

// Close closes the client and cleans up resources
func (c *Judge0Client) Close() {
	if c.rateLimiter != nil {
		c.rateLimiter.Close()
	}
}

// GetRateLimitStatus returns current rate limit status
func (c *Judge0Client) GetRateLimitStatus() int {
	return len(c.rateLimiter.tokens)
}
