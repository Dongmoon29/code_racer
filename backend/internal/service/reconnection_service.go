package service

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/Dongmoon29/code_racer/internal/apperr"
	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/events"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/repository"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

const disconnectedPlayersKey = "disconnected_match_players"

// reconnectionService owns disconnect markers, grace periods, and expiry
// resolution. Its worker has an explicit lifecycle controlled by GameEngine.
type reconnectionService struct {
	matches repository.MatchRepository
	redis   *redis.Client
	state   *RedisManager
	events  events.EventBus
	logger  logger.Logger

	mu     sync.Mutex
	cancel context.CancelFunc
}

func newReconnectionService(matches repository.MatchRepository, redisClient *redis.Client, state *RedisManager, eventBus events.EventBus, appLogger logger.Logger) *reconnectionService {
	return &reconnectionService{matches: matches, redis: redisClient, state: state, events: eventBus, logger: appLogger}
}

func disconnectMember(matchID, userID uuid.UUID) string {
	return matchID.String() + ":" + userID.String()
}

func disconnectMarkerKey(matchID, userID uuid.UUID) string {
	return fmt.Sprintf("match:%s:user:%s:disconnect", matchID, userID)
}

func (s *reconnectionService) Start(parent context.Context) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.redis == nil || s.cancel != nil {
		return
	}
	ctx, cancel := context.WithCancel(parent)
	s.cancel = cancel
	go s.run(ctx)
}

func (s *reconnectionService) Stop() {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.cancel != nil {
		s.cancel()
		s.cancel = nil
	}
}

func (s *reconnectionService) Connected(ctx context.Context, matchID, userID uuid.UUID) error {
	if matchID == uuid.Nil || s.redis == nil {
		return nil
	}
	match, err := s.matches.FindByID(matchID)
	if err != nil {
		return err
	}
	if !isMatchParticipant(match, userID) {
		return apperr.New(apperr.CodeForbidden, "You are not a participant in this match")
	}
	pipe := s.redis.TxPipeline()
	pipe.Del(ctx, disconnectMarkerKey(matchID, userID))
	pipe.ZRem(ctx, disconnectedPlayersKey, disconnectMember(matchID, userID))
	_, err = pipe.Exec(ctx)
	return err
}

func (s *reconnectionService) Disconnected(ctx context.Context, matchID, userID uuid.UUID) error {
	if matchID == uuid.Nil || s.redis == nil {
		return nil
	}
	match, err := s.matches.FindByID(matchID)
	if err != nil {
		return err
	}
	if match.Status != model.MatchStatusPlaying && match.Status != model.MatchStatusWaiting {
		return nil
	}
	if !isMatchParticipant(match, userID) {
		return apperr.New(apperr.CodeForbidden, "You are not a participant in this match")
	}
	deadline := time.Now().Add(constants.ReconnectionGracePeriod)
	pipe := s.redis.TxPipeline()
	pipe.Set(ctx, disconnectMarkerKey(matchID, userID), deadline.UnixMilli(), 24*time.Hour)
	pipe.ZAdd(ctx, disconnectedPlayersKey, redis.Z{Score: float64(deadline.UnixMilli()), Member: disconnectMember(matchID, userID)})
	_, err = pipe.Exec(ctx)
	return err
}

func isMatchParticipant(match *model.Match, userID uuid.UUID) bool {
	return match != nil && (match.PlayerAID == userID || (match.PlayerBID != nil && *match.PlayerBID == userID))
}

func (s *reconnectionService) run(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.resolveExpired(ctx)
		}
	}
}

func (s *reconnectionService) resolveExpired(ctx context.Context) {
	members, err := s.redis.ZRangeByScore(ctx, disconnectedPlayersKey, &redis.ZRangeBy{
		Min: "-inf", Max: fmt.Sprint(time.Now().UnixMilli()), Count: 100,
	}).Result()
	if err != nil {
		s.logger.Warn().Err(err).Msg("Failed to scan expired disconnects")
		return
	}
	for _, member := range members {
		parts := strings.Split(member, ":")
		if len(parts) != 2 {
			_ = s.redis.ZRem(ctx, disconnectedPlayersKey, member).Err()
			continue
		}
		matchID, matchErr := uuid.Parse(parts[0])
		userID, userErr := uuid.Parse(parts[1])
		if matchErr != nil || userErr != nil {
			_ = s.redis.ZRem(ctx, disconnectedPlayersKey, member).Err()
			continue
		}
		s.resolveOne(ctx, matchID, userID, member)
	}
}

func (s *reconnectionService) resolveOne(ctx context.Context, matchID, userID uuid.UUID, member string) {
	lockKey := fmt.Sprintf("match:%s:disconnect_resolution_lock", matchID)
	locked, err := s.redis.SetNX(ctx, lockKey, userID.String(), 30*time.Second).Result()
	if err != nil || !locked {
		return
	}
	defer s.redis.Del(ctx, lockKey)
	if exists, _ := s.redis.Exists(ctx, disconnectMarkerKey(matchID, userID)).Result(); exists == 0 {
		_ = s.redis.ZRem(ctx, disconnectedPlayersKey, member).Err()
		return
	}
	match, err := s.matches.FindByID(matchID)
	if err != nil || (match.Status != model.MatchStatusPlaying && match.Status != model.MatchStatusWaiting) {
		s.ClearMatch(ctx, matchID)
		return
	}
	if match.Mode == model.MatchModeSingle {
		if err := s.matches.CloseMatch(matchID, userID); err != nil {
			return
		}
	} else {
		finished, err := s.matches.FinishDraw(matchID)
		if err != nil || !finished {
			return
		}
		_ = s.state.UpdateMatchStatusContext(ctx, matchID, model.MatchStatusFinished)
		if s.events != nil {
			s.events.Publish(events.TopicGameFinished, &events.GameFinishedEvent{MatchID: matchID.String()})
		}
	}
	s.ClearMatch(ctx, matchID)
}

func (s *reconnectionService) ClearMatch(ctx context.Context, matchID uuid.UUID) {
	users, _ := s.state.GetMatchUsers(matchID)
	pipe := s.redis.TxPipeline()
	for _, rawUserID := range users {
		userID, err := uuid.Parse(rawUserID)
		if err != nil {
			continue
		}
		pipe.Del(ctx, disconnectMarkerKey(matchID, userID))
		pipe.ZRem(ctx, disconnectedPlayersKey, disconnectMember(matchID, userID))
	}
	_, _ = pipe.Exec(ctx)
}
