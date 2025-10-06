package service

import (
	"github.com/Dongmoon29/code_racer/internal/events"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
)

// MatchmakingService handles player matching and game creation
type MatchmakingService interface {
	CreateMatch(player1ID, player2ID uuid.UUID, difficulty string) (interface{}, error)
}

type matchmakingService struct {
	matchService MatchService
	rdb          *redis.Client
	logger       logger.Logger
	eventBus     events.EventBus
}

// NewMatchmakingService creates a new matchmaking service
func NewMatchmakingService(
	matchService MatchService,
	rdb *redis.Client,
	logger logger.Logger,
	opts ...interface{},
) MatchmakingService {
	svc := &matchmakingService{
		matchService: matchService,
		rdb:          rdb,
		logger:       logger,
	}

	// optional: EventBus via opts[0] if provided
	if len(opts) > 0 {
		if bus, ok := opts[0].(events.EventBus); ok {
			svc.eventBus = bus
		}
	}
	return svc
}

// CreateMatch handles the complete match creation flow
func (s *matchmakingService) CreateMatch(player1ID, player2ID uuid.UUID, difficulty string) (interface{}, error) {
	s.logger.Info().
		Str("player1ID", player1ID.String()).
		Str("player2ID", player2ID.String()).
		Str("difficulty", difficulty).
		Msg("Starting match creation")

	match, err := s.matchService.CreateMatch(player1ID, player2ID, difficulty)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to create match")
		return nil, err
	}

	s.logger.Info().
		Str("matchID", match.ID.String()).
		Str("player1ID", player1ID.String()).
		Str("player2ID", player2ID.String()).
		Msg("Match created successfully")

	// Publish event if bus is configured
	if s.eventBus != nil {
		s.eventBus.Publish(events.TopicMatchCreated, &events.MatchCreatedEvent{Match: match})
	}

	return match, nil
}

// Note: WebSocketService dependency intentionally removed to avoid circular references
