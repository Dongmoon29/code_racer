package service

import (
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
)

// MatchmakingService handles player matching and game creation
type MatchmakingService interface {
	CreateMatch(player1ID, player2ID uuid.UUID, difficulty string) (interface{}, error)
	SetWebSocketService(wsService WebSocketService)
}

type matchmakingService struct {
	matchService MatchService
	wsService    WebSocketService
	rdb          *redis.Client
	logger       logger.Logger
}

// NewMatchmakingService creates a new matchmaking service
func NewMatchmakingService(
	matchService MatchService,
	wsService WebSocketService,
	rdb *redis.Client,
	logger logger.Logger,
) MatchmakingService {
	return &matchmakingService{
		matchService: matchService,
		wsService:    wsService,
		rdb:          rdb,
		logger:       logger,
	}
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

	return match, nil
}

// SetWebSocketService sets the WebSocket service (to avoid circular dependency)
func (s *matchmakingService) SetWebSocketService(wsService WebSocketService) {
	s.wsService = wsService
}
