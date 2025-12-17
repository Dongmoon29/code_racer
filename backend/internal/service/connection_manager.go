package service

import (
	"fmt"
	"sync"
	"time"

	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/google/uuid"
)

// ConnectionManager manages WebSocket connections and their states
type ConnectionManager struct {
	connections map[string]*ConnectionState
	mu          sync.RWMutex
	logger      logger.Logger
}

// ConnectionState represents the state of a WebSocket connection
type ConnectionState struct {
	UserID          uuid.UUID
	MatchID         uuid.UUID
	Connected       bool
	LastPing        time.Time
	ReconnectCount  int
	IsActive        bool
	DisconnectTime  time.Time
	ReconnectWindow time.Duration
}

// ReconnectionPolicy defines reconnection behavior
type ReconnectionPolicy struct {
	MaxReconnectAttempts int
	ReconnectDelay       time.Duration
	GracePeriod          time.Duration
	BackoffMultiplier    float64
}

// DefaultReconnectionPolicy returns the default reconnection policy
func DefaultReconnectionPolicy() ReconnectionPolicy {
	return ReconnectionPolicy{
		MaxReconnectAttempts: 3,
		ReconnectDelay:       5 * time.Second,
		GracePeriod:          2 * time.Minute,
		BackoffMultiplier:    2.0,
	}
}

// NewConnectionManager creates a new ConnectionManager instance
func NewConnectionManager(logger logger.Logger) *ConnectionManager {
	return &ConnectionManager{
		connections: make(map[string]*ConnectionState),
		logger:      logger,
	}
}

// RegisterConnection registers a new WebSocket connection
func (cm *ConnectionManager) RegisterConnection(userID, matchID uuid.UUID) *ConnectionState {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	connectionKey := cm.getConnectionKey(userID, matchID)

	state := &ConnectionState{
		UserID:          userID,
		MatchID:         matchID,
		Connected:       true,
		LastPing:        time.Now(),
		ReconnectCount:  0,
		IsActive:        true,
		ReconnectWindow: DefaultReconnectionPolicy().GracePeriod,
	}

	cm.connections[connectionKey] = state

	cm.logger.Info().
		Str("userID", userID.String()).
		Str("matchID", matchID.String()).
		Msg("Connection registered")

	return state
}

// UnregisterConnection unregisters a WebSocket connection
func (cm *ConnectionManager) UnregisterConnection(userID, matchID uuid.UUID) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	connectionKey := cm.getConnectionKey(userID, matchID)

	if state, exists := cm.connections[connectionKey]; exists {
		state.Connected = false
		state.DisconnectTime = time.Now()

		cm.logger.Info().
			Str("userID", userID.String()).
			Str("matchID", matchID.String()).
			Msg("Connection unregistered")
	}
}

// UpdatePing updates the last ping time for a connection
func (cm *ConnectionManager) UpdatePing(userID, matchID uuid.UUID) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	connectionKey := cm.getConnectionKey(userID, matchID)

	if state, exists := cm.connections[connectionKey]; exists {
		state.LastPing = time.Now()
		state.IsActive = true
	}
}

// CanReconnect checks if a user can reconnect to a match
func (cm *ConnectionManager) CanReconnect(userID, matchID uuid.UUID) (bool, error) {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	connectionKey := cm.getConnectionKey(userID, matchID)
	state, exists := cm.connections[connectionKey]

	if !exists {
		return false, fmt.Errorf("connection not found")
	}

	// Check if within grace period
	if time.Since(state.DisconnectTime) > state.ReconnectWindow {
		return false, fmt.Errorf("reconnection window expired")
	}

	// Check reconnect attempts
	policy := DefaultReconnectionPolicy()
	if state.ReconnectCount >= policy.MaxReconnectAttempts {
		return false, fmt.Errorf("max reconnection attempts exceeded")
	}

	return true, nil
}

// AttemptReconnection attempts to reconnect a user
func (cm *ConnectionManager) AttemptReconnection(userID, matchID uuid.UUID) error {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	connectionKey := cm.getConnectionKey(userID, matchID)
	state, exists := cm.connections[connectionKey]

	if !exists {
		return fmt.Errorf("connection not found")
	}

	// Increment reconnect count
	state.ReconnectCount++
	state.Connected = true
	state.LastPing = time.Now()
	state.IsActive = true

	cm.logger.Info().
		Str("userID", userID.String()).
		Str("matchID", matchID.String()).
		Int("attempt", state.ReconnectCount).
		Msg("Reconnection attempted")

	return nil
}

// GetConnectionState returns the connection state for a user
func (cm *ConnectionManager) GetConnectionState(userID, matchID uuid.UUID) (*ConnectionState, bool) {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	connectionKey := cm.getConnectionKey(userID, matchID)
	state, exists := cm.connections[connectionKey]
	return state, exists
}

// GetActiveConnections returns all active connections for a match
func (cm *ConnectionManager) GetActiveConnections(matchID uuid.UUID) []*ConnectionState {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	var activeConnections []*ConnectionState

	for _, state := range cm.connections {
		if state.MatchID == matchID && state.Connected && state.IsActive {
			activeConnections = append(activeConnections, state)
		}
	}

	return activeConnections
}

// CleanupInactiveConnections removes inactive connections
func (cm *ConnectionManager) CleanupInactiveConnections() {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	now := time.Now()
	var toRemove []string

	for key, state := range cm.connections {
		// Remove connections that have been inactive for too long
		if !state.Connected && now.Sub(state.DisconnectTime) > constants.InactiveConnectionThreshold {
			toRemove = append(toRemove, key)
		} else if state.Connected && now.Sub(state.LastPing) > constants.InactiveConnectionThreshold {
			// Remove connections with expired ping
			state.Connected = false
			state.DisconnectTime = now
		}
	}

	// Remove inactive connections
	for _, key := range toRemove {
		delete(cm.connections, key)
	}

	if len(toRemove) > 0 {
		cm.logger.Info().
			Int("count", len(toRemove)).
			Msg("Cleaned up inactive connections")
	}
}

// getConnectionKey generates a unique key for a connection
func (cm *ConnectionManager) getConnectionKey(userID, matchID uuid.UUID) string {
	return fmt.Sprintf("%s:%s", userID.String(), matchID.String())
}

// WebSocketHealthChecker monitors WebSocket connection health
type WebSocketHealthChecker struct {
	connectionManager *ConnectionManager
	redisManager      *RedisManager
	disconnectHandler *UserDisconnectHandler
	logger            logger.Logger
	ticker            *time.Ticker
	stopChan          chan bool
}

// NewWebSocketHealthChecker creates a new WebSocketHealthChecker instance
func NewWebSocketHealthChecker(
	connectionManager *ConnectionManager,
	redisManager *RedisManager,
	disconnectHandler *UserDisconnectHandler,
	logger logger.Logger,
) *WebSocketHealthChecker {
	return &WebSocketHealthChecker{
		connectionManager: connectionManager,
		redisManager:      redisManager,
		disconnectHandler: disconnectHandler,
		logger:            logger,
		stopChan:          make(chan bool),
	}
}

// Start starts the health checker
func (hc *WebSocketHealthChecker) Start() {
	hc.ticker = time.NewTicker(30 * time.Second) // Check every 30 seconds

	go func() {
		for {
			select {
			case <-hc.ticker.C:
				hc.checkConnections()
			case <-hc.stopChan:
				hc.ticker.Stop()
				return
			}
		}
	}()

	hc.logger.Info().Msg("WebSocket health checker started")
}

// Stop stops the health checker
func (hc *WebSocketHealthChecker) Stop() {
	hc.stopChan <- true
	hc.logger.Info().Msg("WebSocket health checker stopped")
}

// checkConnections checks the health of all connections
func (hc *WebSocketHealthChecker) checkConnections() {
	hc.connectionManager.CleanupInactiveConnections()

	// Check for abandoned matches
	hc.checkAbandonedMatches()
}

// checkAbandonedMatches checks for matches with no active connections
func (hc *WebSocketHealthChecker) checkAbandonedMatches() {
	// This would iterate through all matches and check if they have active connections
	// If no active connections exist for a certain period, clean up the match

	hc.logger.Debug().Msg("Checking for abandoned matches")
}

// ConnectionMetrics tracks connection metrics
type ConnectionMetrics struct {
	TotalConnections     int
	ActiveConnections    int
	InactiveConnections  int
	ReconnectionAttempts int
	FailedReconnections  int
}

// GetMetrics returns current connection metrics
func (cm *ConnectionManager) GetMetrics() ConnectionMetrics {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	metrics := ConnectionMetrics{
		TotalConnections: len(cm.connections),
	}

	now := time.Now()

	for _, state := range cm.connections {
		if state.Connected && now.Sub(state.LastPing) < constants.InactiveConnectionThreshold {
			metrics.ActiveConnections++
		} else {
			metrics.InactiveConnections++
		}

		metrics.ReconnectionAttempts += state.ReconnectCount
	}

	return metrics
}
