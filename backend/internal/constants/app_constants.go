package constants

import "time"

// Authentication constants
const (
	// AccessTokenExpiry is deliberately short because access tokens are exposed
	// to browser JavaScript for API and WebSocket authentication.
	AccessTokenExpiry = 15 * time.Minute

	// RefreshTokenExpiry is the absolute lifetime of a persistent login session.
	RefreshTokenExpiry = 30 * 24 * time.Hour

	RefreshTokenCookieName       = "refresh_token"
	SecureRefreshTokenCookieName = "__Host-refresh_token"
)

// WebSocket constants
const (
	// PongWait is the time to wait for pong response
	PongWait = 60 * time.Second

	// PingIntervalSeconds is the interval between ping messages
	PingIntervalSeconds = 54

	// WriteDeadlineSeconds is the write deadline in seconds
	WriteDeadlineSeconds = 10

	// ClientSendBufferSize is the buffer size for client send channel
	ClientSendBufferSize = 256

	// MaxMessageSize is the maximum message size in bytes (1MB)
	MaxMessageSize = 1024 * 1024
)

// Security constants
const (
	// MinJWTSecretLength is the minimum required length for JWT secret
	MinJWTSecretLength = 32
)

// Database constants
const (
	// DefaultDBMaxOpenConns is the default maximum number of open connections
	DefaultDBMaxOpenConns = 25

	// DefaultDBMaxIdleConns is the default maximum number of idle connections
	DefaultDBMaxIdleConns = 5

	// DefaultDBConnMaxLifetime is the default maximum lifetime of a connection
	DefaultDBConnMaxLifetime = 5 * time.Minute
)

// Redis constants
const (
	// DefaultRedisPoolSize is the default Redis connection pool size
	DefaultRedisPoolSize = 10

	// DefaultRedisMinIdleConns is the default minimum number of idle connections
	DefaultRedisMinIdleConns = 5

	// DefaultRedisMaxRetries is the default maximum number of retries
	DefaultRedisMaxRetries = 3

	// DefaultRedisDialTimeout is the default dial timeout
	DefaultRedisDialTimeout = 5 * time.Second
)

// User disconnection constants
const (
	// ReconnectionGracePeriod is the grace period allowed for user reconnection
	ReconnectionGracePeriod = 5 * time.Minute

	// InactiveConnectionThreshold is the threshold for considering a connection inactive
	InactiveConnectionThreshold = 5 * time.Minute
)
