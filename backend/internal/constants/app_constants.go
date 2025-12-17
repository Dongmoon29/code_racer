package constants

import "time"

// Authentication constants
const (
	// TokenExpiryDays is the number of days a JWT token remains valid
	TokenExpiryDays = 7

	// CookieExpirySeconds is the cookie expiration time in seconds (7 days)
	CookieExpirySeconds = 3600 * 24 * 7
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
