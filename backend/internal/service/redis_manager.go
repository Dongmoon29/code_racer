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

// RedisManager handles all Redis operations for matches
type RedisManager struct {
	rdb    *redis.Client
	logger logger.Logger
}

// Redis key patterns
const (
	MatchDataKey   = "match:%s:data"   // Hash: match metadata
	MatchUsersKey  = "match:%s:users"  // Set: participant user IDs
	MatchCodesKey  = "match:%s:codes"  // Hash: user_id -> code
	MatchStatusKey = "match:%s:status" // String: current status
	MatchExpiryKey = "match:%s:expiry" // String: expiration timestamp
)

// Match metadata fields
const (
	FieldStatus     = "status"
	FieldCreatedAt  = "created_at"
	FieldStartedAt  = "started_at"
	FieldFinishedAt = "finished_at"
	FieldLeetCodeID = "leetcode_id"
	FieldDifficulty = "difficulty"
)

// NewRedisManager creates a new RedisManager instance
func NewRedisManager(rdb *redis.Client, logger logger.Logger) *RedisManager {
	return &RedisManager{
		rdb:    rdb,
		logger: logger,
	}
}

// CreateMatch creates Redis data structure for a new match
func (rm *RedisManager) CreateMatch(matchID uuid.UUID, player1ID, player2ID uuid.UUID, leetcodeID uint, difficulty string) error {
	ctx := context.Background()
	now := time.Now()

	// Calculate expiration time (24 hours from now)
	expiresAt := now.Add(24 * time.Hour)

	pipe := rm.rdb.Pipeline()

	// Set match metadata
	matchDataKey := fmt.Sprintf(MatchDataKey, matchID.String())
	pipe.HSet(ctx, matchDataKey, map[string]interface{}{
		FieldStatus:     string(model.MatchStatusPlaying),
		FieldCreatedAt:  now.Unix(),
		FieldStartedAt:  now.Unix(),
		FieldLeetCodeID: leetcodeID,
		FieldDifficulty: difficulty,
	})
	pipe.Expire(ctx, matchDataKey, 24*time.Hour)

	// Add users to match
	matchUsersKey := fmt.Sprintf(MatchUsersKey, matchID.String())
	pipe.SAdd(ctx, matchUsersKey, player1ID.String(), player2ID.String())
	pipe.Expire(ctx, matchUsersKey, 24*time.Hour)

	// Initialize empty codes for both players
	matchCodesKey := fmt.Sprintf(MatchCodesKey, matchID.String())
	pipe.HSet(ctx, matchCodesKey, player1ID.String(), "")
	pipe.HSet(ctx, matchCodesKey, player2ID.String(), "")
	pipe.Expire(ctx, matchCodesKey, 24*time.Hour)

	// Set expiration timestamp
	matchExpiryKey := fmt.Sprintf(MatchExpiryKey, matchID.String())
	pipe.Set(ctx, matchExpiryKey, expiresAt.Unix(), 24*time.Hour)

	_, err := pipe.Exec(ctx)
	if err != nil {
		rm.logger.Error().Err(err).Str("matchID", matchID.String()).Msg("Failed to create match in Redis")
		return fmt.Errorf("failed to create match in Redis: %w", err)
	}

	rm.logger.Info().
		Str("matchID", matchID.String()).
		Str("player1", player1ID.String()).
		Str("player2", player2ID.String()).
		Str("difficulty", difficulty).
		Msg("Match created in Redis")

	return nil
}

// UpdateUserCode updates a user's code in the match
func (rm *RedisManager) UpdateUserCode(matchID, userID uuid.UUID, code string) error {
	ctx := context.Background()
	matchCodesKey := fmt.Sprintf(MatchCodesKey, matchID.String())

	err := rm.rdb.HSet(ctx, matchCodesKey, userID.String(), code).Err()
	if err != nil {
		rm.logger.Error().Err(err).
			Str("matchID", matchID.String()).
			Str("userID", userID.String()).
			Msg("Failed to update user code")
		return fmt.Errorf("failed to update user code: %w", err)
	}

	return nil
}

// GetUserCode retrieves a user's code from the match
func (rm *RedisManager) GetUserCode(matchID, userID uuid.UUID) (string, error) {
	ctx := context.Background()
	matchCodesKey := fmt.Sprintf(MatchCodesKey, matchID.String())

	code, err := rm.rdb.HGet(ctx, matchCodesKey, userID.String()).Result()
	if err != nil {
		if err == redis.Nil {
			return "", nil // Code not found
		}
		rm.logger.Error().Err(err).
			Str("matchID", matchID.String()).
			Str("userID", userID.String()).
			Msg("Failed to get user code")
		return "", fmt.Errorf("failed to get user code: %w", err)
	}

	return code, nil
}

// GetAllUserCodes retrieves all user codes for a match
func (rm *RedisManager) GetAllUserCodes(matchID uuid.UUID) (map[string]string, error) {
	ctx := context.Background()
	matchCodesKey := fmt.Sprintf(MatchCodesKey, matchID.String())

	codes, err := rm.rdb.HGetAll(ctx, matchCodesKey).Result()
	if err != nil {
		rm.logger.Error().Err(err).
			Str("matchID", matchID.String()).
			Msg("Failed to get all user codes")
		return nil, fmt.Errorf("failed to get all user codes: %w", err)
	}

	return codes, nil
}

// GetMatchUsers retrieves all users in a match
func (rm *RedisManager) GetMatchUsers(matchID uuid.UUID) ([]string, error) {
	ctx := context.Background()
	matchUsersKey := fmt.Sprintf(MatchUsersKey, matchID.String())

	users, err := rm.rdb.SMembers(ctx, matchUsersKey).Result()
	if err != nil {
		rm.logger.Error().Err(err).
			Str("matchID", matchID.String()).
			Msg("Failed to get match users")
		return nil, fmt.Errorf("failed to get match users: %w", err)
	}

	return users, nil
}

// UpdateMatchStatus updates the match status
func (rm *RedisManager) UpdateMatchStatus(matchID uuid.UUID, status model.MatchStatus) error {
	ctx := context.Background()
	matchDataKey := fmt.Sprintf(MatchDataKey, matchID.String())

	now := time.Now()
	updates := map[string]interface{}{
		FieldStatus: string(status),
	}

	// Set finished_at timestamp if match is finished
	if status == model.MatchStatusFinished || status == model.MatchStatusClosed {
		updates[FieldFinishedAt] = now.Unix()
	}

	err := rm.rdb.HSet(ctx, matchDataKey, updates).Err()
	if err != nil {
		rm.logger.Error().Err(err).
			Str("matchID", matchID.String()).
			Str("status", string(status)).
			Msg("Failed to update match status")
		return fmt.Errorf("failed to update match status: %w", err)
	}

	rm.logger.Info().
		Str("matchID", matchID.String()).
		Str("status", string(status)).
		Msg("Match status updated")

	return nil
}

// RemoveUserFromMatch removes a user from the match
func (rm *RedisManager) RemoveUserFromMatch(matchID, userID uuid.UUID) error {
	ctx := context.Background()

	pipe := rm.rdb.Pipeline()

	// Remove user from users set
	matchUsersKey := fmt.Sprintf(MatchUsersKey, matchID.String())
	pipe.SRem(ctx, matchUsersKey, userID.String())

	// Remove user's code
	matchCodesKey := fmt.Sprintf(MatchCodesKey, matchID.String())
	pipe.HDel(ctx, matchCodesKey, userID.String())

	_, err := pipe.Exec(ctx)
	if err != nil {
		rm.logger.Error().Err(err).
			Str("matchID", matchID.String()).
			Str("userID", userID.String()).
			Msg("Failed to remove user from match")
		return fmt.Errorf("failed to remove user from match: %w", err)
	}

	rm.logger.Info().
		Str("matchID", matchID.String()).
		Str("userID", userID.String()).
		Msg("User removed from match")

	return nil
}

// CleanupMatch completely removes a match from Redis
func (rm *RedisManager) CleanupMatch(matchID uuid.UUID) error {
	ctx := context.Background()

	pipe := rm.rdb.Pipeline()

	// Remove all match-related keys
	matchDataKey := fmt.Sprintf(MatchDataKey, matchID.String())
	matchUsersKey := fmt.Sprintf(MatchUsersKey, matchID.String())
	matchCodesKey := fmt.Sprintf(MatchCodesKey, matchID.String())
	matchExpiryKey := fmt.Sprintf(MatchExpiryKey, matchID.String())

	pipe.Del(ctx, matchDataKey, matchUsersKey, matchCodesKey, matchExpiryKey)

	_, err := pipe.Exec(ctx)
	if err != nil {
		rm.logger.Error().Err(err).
			Str("matchID", matchID.String()).
			Msg("Failed to cleanup match")
		return fmt.Errorf("failed to cleanup match: %w", err)
	}

	rm.logger.Info().
		Str("matchID", matchID.String()).
		Msg("Match cleaned up from Redis")

	return nil
}

// IsMatchEmpty checks if a match has no remaining users
func (rm *RedisManager) IsMatchEmpty(matchID uuid.UUID) (bool, error) {
	ctx := context.Background()
	matchUsersKey := fmt.Sprintf(MatchUsersKey, matchID.String())

	count, err := rm.rdb.SCard(ctx, matchUsersKey).Result()
	if err != nil {
		rm.logger.Error().Err(err).
			Str("matchID", matchID.String()).
			Msg("Failed to check if match is empty")
		return false, fmt.Errorf("failed to check if match is empty: %w", err)
	}

	return count == 0, nil
}

// GetMatchMetadata retrieves match metadata
func (rm *RedisManager) GetMatchMetadata(matchID uuid.UUID) (map[string]string, error) {
	ctx := context.Background()
	matchDataKey := fmt.Sprintf(MatchDataKey, matchID.String())

	metadata, err := rm.rdb.HGetAll(ctx, matchDataKey).Result()
	if err != nil {
		rm.logger.Error().Err(err).
			Str("matchID", matchID.String()).
			Msg("Failed to get match metadata")
		return nil, fmt.Errorf("failed to get match metadata: %w", err)
	}

	return metadata, nil
}

// CleanupExpiredMatches removes expired matches from Redis
func (rm *RedisManager) CleanupExpiredMatches() error {
	ctx := context.Background()

	// Find all match data keys
	pattern := fmt.Sprintf(MatchDataKey, "*")
	keys, err := rm.rdb.Keys(ctx, pattern).Result()
	if err != nil {
		rm.logger.Error().Err(err).Msg("Failed to find match keys")
		return fmt.Errorf("failed to find match keys: %w", err)
	}

	var expiredMatches []string

	for _, key := range keys {
		// Extract match ID from key
		matchIDStr := key[len("match:") : len(key)-len(":data")]
		matchID, err := uuid.Parse(matchIDStr)
		if err != nil {
			rm.logger.Warn().Str("key", key).Msg("Invalid match ID in key")
			continue
		}

		// Check if match is expired
		matchExpiryKey := fmt.Sprintf(MatchExpiryKey, matchID.String())
		expiryStr, err := rm.rdb.Get(ctx, matchExpiryKey).Result()
		if err != nil {
			if err == redis.Nil {
				// No expiry set, consider it expired
				expiredMatches = append(expiredMatches, matchID.String())
			}
			continue
		}

		expiry, err := time.Parse(time.RFC3339, expiryStr)
		if err != nil {
			rm.logger.Warn().Str("expiry", expiryStr).Msg("Invalid expiry format")
			continue
		}

		if time.Now().After(expiry) {
			expiredMatches = append(expiredMatches, matchID.String())
		}
	}

	// Cleanup expired matches
	for _, matchIDStr := range expiredMatches {
		matchID, err := uuid.Parse(matchIDStr)
		if err != nil {
			continue
		}

		if err := rm.CleanupMatch(matchID); err != nil {
			rm.logger.Error().Err(err).
				Str("matchID", matchIDStr).
				Msg("Failed to cleanup expired match")
		}
	}

	if len(expiredMatches) > 0 {
		rm.logger.Info().
			Int("count", len(expiredMatches)).
			Msg("Cleaned up expired matches")
	}

	return nil
}
