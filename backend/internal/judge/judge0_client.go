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

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/types"
)

// Judge0Client is an improved client responsible for communication with Judge0 API
type Judge0Client struct {
	apiKey      string
	apiEndpoint string
	httpClient  *http.Client
	rateLimiter *RateLimiter
	logger      logger.Logger
	mutex       sync.RWMutex
}

// RateLimiter manages API call rate limiting
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

// Judge0Config holds Judge0 client configuration
type Judge0Config struct {
	APIKey      string
	APIEndpoint string
	Logger      logger.Logger
	Timeout     time.Duration
	RateLimit   int           // requests per window
	Window      time.Duration // rate limit window
	RetryCount  int           // number of retries on failure
	RetryDelay  time.Duration // delay between retries
}

// DefaultJudge0Config returns default configuration
func DefaultJudge0Config(apiKey, apiEndpoint string, log logger.Logger) *Judge0Config {
	return &Judge0Config{
		APIKey:      apiKey,
		APIEndpoint: apiEndpoint,
		Logger:      log,
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
		logger:      config.Logger,
		httpClient: &http.Client{
			Timeout: config.Timeout,
		},
		rateLimiter: NewRateLimiter(config.RateLimit, config.Window),
	}
}

func truncateForLog(s string, max int) (string, bool) {
	if max <= 0 {
		return "", len(s) > 0
	}
	if len(s) <= max {
		return s, false
	}
	return s[:max] + "...(truncated)", true
}

// SubmitCode submits code to Judge0 API and returns results (improved version)
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
	startTime := time.Now()

	// Serialize request data
	reqBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Log Judge0 request with truncated source code
	if c.logger != nil {
		sourceCodeTrunc, _ := truncateForLog(req.SourceCode, 16_000)
		c.logger.Info().
			Int("languageID", req.LanguageID).
			Str("sourceCode", sourceCodeTrunc).
			Str("expectedOutput", req.ExpectedOutput).
			Str("stdin", req.Stdin).
			Int("compileTimeout", req.CompileTimeout).
			Int("runTimeout", req.RunTimeout).
			Int("memoryLimit", req.MemoryLimit).
			Bool("enableNetworking", req.EnableNetworking).
			Str("endpoint", c.apiEndpoint).
			Msg("🚀 Submitting code to Judge0")
	}

	// Create API request
	request, err := http.NewRequestWithContext(
		ctx,
		"POST",
		fmt.Sprintf("%s/submissions?wait=true", c.apiEndpoint),
		bytes.NewBuffer(reqBody),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("X-RapidAPI-Key", c.apiKey)
	if parsed, perr := url.Parse(c.apiEndpoint); perr == nil {
		if parsed.Host != "" {
			request.Header.Set("X-RapidAPI-Host", parsed.Host)
		}
	}

	// Log before HTTP call
	if c.logger != nil {
		c.logger.Info().
			Str("method", "POST").
			Str("url", fmt.Sprintf("%s/submissions?wait=true", c.apiEndpoint)).
			Msg("⏳ Sending HTTP request to Judge0...")
	}

	// Execute API request
	resp, err := c.httpClient.Do(request)

	// Log after HTTP call (success or failure)
	elapsed := time.Since(startTime)
	if err != nil {
		if c.logger != nil {
			c.logger.Error().
				Err(err).
				Dur("elapsed", elapsed).
				Msg("❌ Judge0 HTTP request failed")
		}
	} else if c.logger != nil {
		c.logger.Info().
			Int("statusCode", resp.StatusCode).
			Dur("elapsed", elapsed).
			Msg("✅ Judge0 HTTP response received")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Check response status code
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("judge0 API error (status %d): %s", resp.StatusCode, string(body))
	}

	// Parse response
	var result types.Judge0Response
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// Log Judge0 response in a readable format
	if c.logger != nil {
		c.logJudge0Response(&result, resp.StatusCode)
	}

	return &result, nil
}

// logJudge0Response logs the Judge0 response in a readable format
func (c *Judge0Client) logJudge0Response(resp *types.Judge0Response, statusCode int) {
	logger := c.logger.Info().Int("statusCode", statusCode)

	// Log execution metrics
	timeValue := getFloat64Time(resp.Time)
	logger = logger.
		Float64("executionTime", timeValue).
		Float64("memoryUsage", resp.Memory)

	// Log stdout (with truncation and newline indication)
	if resp.Stdout != "" {
		stdoutTrunc, wasTrunc := truncateForLog(resp.Stdout, 1000)
		logger = logger.Str("stdout", stdoutTrunc)
		if wasTrunc {
			logger = logger.Bool("stdoutTruncated", true)
		}
	}

	// Log stderr if present
	if resp.Stderr != "" {
		stderrTrunc, wasTrunc := truncateForLog(resp.Stderr, 1000)
		logger = logger.Str("stderr", stderrTrunc)
		if wasTrunc {
			logger = logger.Bool("stderrTruncated", true)
		}
	}

	// Log compile errors if present
	if resp.CompileError != "" {
		compileErrTrunc, wasTrunc := truncateForLog(resp.CompileError, 1000)
		logger = logger.Str("compileError", compileErrTrunc)
		if wasTrunc {
			logger = logger.Bool("compileErrorTruncated", true)
		}
	}

	// Log compile output if present
	if resp.CompileOutput != "" {
		compileOutTrunc, wasTrunc := truncateForLog(resp.CompileOutput, 1000)
		logger = logger.Str("compileOutput", compileOutTrunc)
		if wasTrunc {
			logger = logger.Bool("compileOutputTruncated", true)
		}
	}

	logger.Msg("Judge0 response received")
}

// getFloat64Time converts various time types to float64 (helper for logging)
func getFloat64Time(timeValue interface{}) float64 {
	switch v := timeValue.(type) {
	case float64:
		return v
	case float32:
		return float64(v)
	case int:
		return float64(v)
	case int64:
		return float64(v)
	case string:
		// Return 0 for string time values (can be enhanced if needed)
		return 0
	default:
		return 0
	}
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
