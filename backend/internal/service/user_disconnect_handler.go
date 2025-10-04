package service

import (
	"context"
	"fmt"
	"time"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
)

// UserDisconnectHandler handles user disconnection scenarios
type UserDisconnectHandler struct {
	redisManager *RedisManager
	matchService MatchService
	logger       logger.Logger
}

// DisconnectReason represents the reason for user disconnection
type DisconnectReason int

const (
	DisconnectReasonNetworkError DisconnectReason = iota
	DisconnectReasonUserIntentional
	DisconnectReasonTimeout
	DisconnectReasonServerError
)

// DisconnectScenario represents different scenarios when user disconnects
type DisconnectScenario int

const (
	ScenarioMatchmaking DisconnectScenario = iota
	ScenarioWaitingRoom
	ScenarioActiveGame
	ScenarioGameFinished
)

// NewUserDisconnectHandler creates a new UserDisconnectHandler instance
func NewUserDisconnectHandler(redisManager *RedisManager, matchService MatchService, logger logger.Logger) *UserDisconnectHandler {
	return &UserDisconnectHandler{
		redisManager: redisManager,
		matchService: matchService,
		logger:       logger,
	}
}

// HandleUserDisconnect handles user disconnection based on scenario and reason
func (h *UserDisconnectHandler) HandleUserDisconnect(matchID, userID uuid.UUID, reason DisconnectReason) error {
	// Determine the scenario
	scenario, err := h.determineDisconnectScenario(matchID, userID)
	if err != nil {
		h.logger.Error().Err(err).
			Str("matchID", matchID.String()).
			Str("userID", userID.String()).
			Msg("Failed to determine disconnect scenario")
		return err
	}

	h.logger.Info().
		Str("matchID", matchID.String()).
		Str("userID", userID.String()).
		Int("scenario", int(scenario)).
		Int("reason", int(reason)).
		Msg("Handling user disconnect")

	// Handle based on scenario
	switch scenario {
	case ScenarioMatchmaking:
		return h.handleMatchmakingDisconnect(userID, reason)
	case ScenarioWaitingRoom:
		return h.handleWaitingRoomDisconnect(matchID, userID, reason)
	case ScenarioActiveGame:
		return h.handleActiveGameDisconnect(matchID, userID, reason)
	case ScenarioGameFinished:
		return h.handleGameFinishedDisconnect(matchID, userID, reason)
	default:
		return fmt.Errorf("unknown disconnect scenario: %d", scenario)
	}
}

// determineDisconnectScenario determines the scenario based on match state
func (h *UserDisconnectHandler) determineDisconnectScenario(matchID, userID uuid.UUID) (DisconnectScenario, error) {
	// If matchID is nil, user was in matchmaking
	if matchID == uuid.Nil {
		return ScenarioMatchmaking, nil
	}

	// Get match metadata
	metadata, err := h.redisManager.GetMatchMetadata(matchID)
	if err != nil {
		return ScenarioMatchmaking, err // Default to matchmaking if we can't determine
	}

	status, exists := metadata["status"]
	if !exists {
		return ScenarioMatchmaking, fmt.Errorf("match status not found")
	}

	switch model.MatchStatus(status) {
	case model.MatchStatusWaiting:
		return ScenarioWaitingRoom, nil
	case model.MatchStatusPlaying:
		return ScenarioActiveGame, nil
	case model.MatchStatusFinished, model.MatchStatusClosed:
		return ScenarioGameFinished, nil
	default:
		return ScenarioMatchmaking, nil
	}
}

// handleMatchmakingDisconnect handles disconnection during matchmaking
func (h *UserDisconnectHandler) handleMatchmakingDisconnect(userID uuid.UUID, reason DisconnectReason) error {
	h.logger.Info().
		Str("userID", userID.String()).
		Int("reason", int(reason)).
		Msg("User disconnected during matchmaking")

	// For matchmaking, we just log the disconnection
	// The matchmaking service will handle removing the user from the queue
	return nil
}

// handleWaitingRoomDisconnect handles disconnection in waiting room
func (h *UserDisconnectHandler) handleWaitingRoomDisconnect(matchID, userID uuid.UUID, reason DisconnectReason) error {
	h.logger.Info().
		Str("matchID", matchID.String()).
		Str("userID", userID.String()).
		Int("reason", int(reason)).
		Msg("User disconnected from waiting room")

	// Remove user from match
	if err := h.redisManager.RemoveUserFromMatch(matchID, userID); err != nil {
		return err
	}

	// Check if match is now empty
	isEmpty, err := h.redisManager.IsMatchEmpty(matchID)
	if err != nil {
		return err
	}

	if isEmpty {
		// Clean up the entire match
		return h.redisManager.CleanupMatch(matchID)
	}

	// Notify remaining users about the disconnection
	return h.notifyRemainingUsers(matchID, userID, "opponent_left")
}

// handleActiveGameDisconnect handles disconnection during active game
func (h *UserDisconnectHandler) handleActiveGameDisconnect(matchID, userID uuid.UUID, reason DisconnectReason) error {
	h.logger.Info().
		Str("matchID", matchID.String()).
		Str("userID", userID.String()).
		Int("reason", int(reason)).
		Msg("User disconnected during active game")

	// Handle based on disconnect reason
	switch reason {
	case DisconnectReasonUserIntentional:
		// User intentionally left - mark as forfeit
		return h.handleGameForfeit(matchID, userID)
	case DisconnectReasonNetworkError, DisconnectReasonTimeout:
		// Network issues - give grace period for reconnection
		return h.handleNetworkDisconnect(matchID, userID)
	case DisconnectReasonServerError:
		// Server error - mark as technical issue
		return h.handleTechnicalDisconnect(matchID, userID)
	default:
		// Default to forfeit
		return h.handleGameForfeit(matchID, userID)
	}
}

// handleGameFinishedDisconnect handles disconnection after game is finished
func (h *UserDisconnectHandler) handleGameFinishedDisconnect(matchID, userID uuid.UUID, reason DisconnectReason) error {
	h.logger.Info().
		Str("matchID", matchID.String()).
		Str("userID", userID.String()).
		Int("reason", int(reason)).
		Msg("User disconnected after game finished")

	// For finished games, just remove user data
	return h.redisManager.RemoveUserFromMatch(matchID, userID)
}

// handleGameForfeit handles when user forfeits the game
func (h *UserDisconnectHandler) handleGameForfeit(matchID, userID uuid.UUID) error {
	h.logger.Info().
		Str("matchID", matchID.String()).
		Str("userID", userID.String()).
		Msg("User forfeited the game")

	// Update match status to finished
	if err := h.redisManager.UpdateMatchStatus(matchID, model.MatchStatusFinished); err != nil {
		return err
	}

	// Remove user from match
	if err := h.redisManager.RemoveUserFromMatch(matchID, userID); err != nil {
		return err
	}

	// Notify remaining users about forfeit
	return h.notifyRemainingUsers(matchID, userID, "opponent_forfeit")
}

// handleNetworkDisconnect handles network-related disconnections
func (h *UserDisconnectHandler) handleNetworkDisconnect(matchID, userID uuid.UUID) error {
	h.logger.Info().
		Str("matchID", matchID.String()).
		Str("userID", userID.String()).
		Msg("User disconnected due to network issues")

	// Set a grace period for reconnection (5 minutes)
	gracePeriod := 5 * time.Minute

	// Store disconnect timestamp in Redis for reconnection tracking
	disconnectKey := fmt.Sprintf("match:%s:user:%s:disconnect", matchID.String(), userID.String())
	ctx := context.Background()

	// Store disconnect time with expiration
	disconnectTime := time.Now()
	err := h.redisManager.rdb.Set(ctx, disconnectKey, disconnectTime.Unix(), gracePeriod).Err()
	if err != nil {
		h.logger.Error().Err(err).
			Str("matchID", matchID.String()).
			Str("userID", userID.String()).
			Msg("Failed to store disconnect timestamp")
	}

	// Update match status to indicate network issue
	if err := h.redisManager.UpdateMatchStatus(matchID, model.MatchStatusWaiting); err != nil {
		h.logger.Error().Err(err).
			Str("matchID", matchID.String()).
			Msg("Failed to update match status for network disconnect")
	}

	// Notify remaining users about network disconnect with reconnection possibility
	return h.notifyRemainingUsers(matchID, userID, "opponent_network_issue")
}

// handleTechnicalDisconnect handles server-related disconnections
func (h *UserDisconnectHandler) handleTechnicalDisconnect(matchID, userID uuid.UUID) error {
	h.logger.Info().
		Str("matchID", matchID.String()).
		Str("userID", userID.String()).
		Msg("User disconnected due to technical issues")

	// For technical issues, we might want to pause the game
	// or give both users a chance to reconnect

	// Notify remaining users about technical issue
	return h.notifyRemainingUsers(matchID, userID, "technical_issue")
}

// notifyRemainingUsers notifies remaining users about the disconnection
func (h *UserDisconnectHandler) notifyRemainingUsers(matchID, userID uuid.UUID, eventType string) error {
	// Get remaining users
	users, err := h.redisManager.GetMatchUsers(matchID)
	if err != nil {
		return err
	}

	// Broadcast to remaining users
	// This would integrate with WebSocket service
	// TODO: Implement actual WebSocket broadcasting
	h.logger.Info().
		Str("matchID", matchID.String()).
		Str("userID", userID.String()).
		Str("eventType", eventType).
		Int("remainingUsers", len(users)).
		Msg("Notifying remaining users about disconnection")

	return nil
}

// CheckReconnectionEligibility checks if a user can reconnect to a match
func (h *UserDisconnectHandler) CheckReconnectionEligibility(matchID, userID uuid.UUID) (bool, error) {
	// Check if disconnect timestamp exists (within grace period)
	disconnectKey := fmt.Sprintf("match:%s:user:%s:disconnect", matchID.String(), userID.String())
	ctx := context.Background()

	disconnectTimeStr, err := h.redisManager.rdb.Get(ctx, disconnectKey).Result()
	if err != nil {
		if err == redis.Nil {
			// No disconnect record, user wasn't disconnected due to network issues
			return false, nil
		}
		return false, fmt.Errorf("failed to check disconnect timestamp: %w", err)
	}

	// Parse disconnect time
	disconnectTime, err := time.Parse(time.RFC3339, disconnectTimeStr)
	if err != nil {
		return false, fmt.Errorf("invalid disconnect timestamp format: %w", err)
	}

	// Check if within grace period (5 minutes)
	gracePeriod := 5 * time.Minute
	if time.Since(disconnectTime) > gracePeriod {
		return false, fmt.Errorf("reconnection grace period expired")
	}

	// Get match metadata
	metadata, err := h.redisManager.GetMatchMetadata(matchID)
	if err != nil {
		return false, err
	}

	status, exists := metadata["status"]
	if !exists {
		return false, fmt.Errorf("match status not found")
	}

	// Only allow reconnection for waiting or playing matches
	if model.MatchStatus(status) != model.MatchStatusWaiting &&
		model.MatchStatus(status) != model.MatchStatusPlaying {
		return false, fmt.Errorf("match is not in reconnection state")
	}

	// Check if user is still in the match
	users, err := h.redisManager.GetMatchUsers(matchID)
	if err != nil {
		return false, err
	}

	for _, user := range users {
		if user == userID.String() {
			return true, nil
		}
	}

	return false, fmt.Errorf("user not found in match")
}

// HandleUserReconnection handles when a user successfully reconnects
func (h *UserDisconnectHandler) HandleUserReconnection(matchID, userID uuid.UUID) error {
	h.logger.Info().
		Str("matchID", matchID.String()).
		Str("userID", userID.String()).
		Msg("User successfully reconnected")

	// Remove disconnect timestamp
	disconnectKey := fmt.Sprintf("match:%s:user:%s:disconnect", matchID.String(), userID.String())
	ctx := context.Background()

	err := h.redisManager.rdb.Del(ctx, disconnectKey).Err()
	if err != nil {
		h.logger.Error().Err(err).
			Str("matchID", matchID.String()).
			Str("userID", userID.String()).
			Msg("Failed to remove disconnect timestamp")
	}

	// Update match status back to playing
	if err := h.redisManager.UpdateMatchStatus(matchID, model.MatchStatusPlaying); err != nil {
		h.logger.Error().Err(err).
			Str("matchID", matchID.String()).
			Msg("Failed to update match status after reconnection")
		return err
	}

	// Notify remaining users about successful reconnection
	return h.notifyRemainingUsers(matchID, userID, "opponent_reconnected")
}

// CleanupAbandonedMatches cleans up matches where all users have disconnected
func (h *UserDisconnectHandler) CleanupAbandonedMatches() error {
	// This would be called periodically to clean up abandoned matches
	// Implementation would check for matches with no active connections
	// and clean them up after a certain period

	h.logger.Info().Msg("Cleaning up abandoned matches")
	return nil
}
