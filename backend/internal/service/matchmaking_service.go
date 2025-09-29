package service

import (
	"encoding/json"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
)

// MatchmakingService handles player matching and game creation
type MatchmakingService interface {
	CreateMatch(player1ID, player2ID uuid.UUID, difficulty string) error
	SetWebSocketService(wsService WebSocketService)
}

type matchmakingService struct {
	gameService GameService
	wsService   WebSocketService
	rdb         *redis.Client
	logger      logger.Logger
}

// NewMatchmakingService creates a new matchmaking service
func NewMatchmakingService(
	gameService GameService,
	wsService WebSocketService,
	rdb *redis.Client,
	logger logger.Logger,
) MatchmakingService {
	return &matchmakingService{
		gameService: gameService,
		wsService:   wsService,
		rdb:         rdb,
		logger:      logger,
	}
}

// CreateMatch handles the complete match creation flow
func (s *matchmakingService) CreateMatch(player1ID, player2ID uuid.UUID, difficulty string) error {
	s.logger.Info().
		Str("player1ID", player1ID.String()).
		Str("player2ID", player2ID.String()).
		Str("difficulty", difficulty).
		Msg("Starting match creation")

	// 1. Create the actual game
	game, err := s.gameService.CreateGameForMatch(player1ID, player2ID, difficulty)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to create game for match")
		return s.notifyMatchError(player1ID, player2ID, "Failed to create game")
	}

	// 2. Notify both players about successful match
	if err := s.notifyMatchSuccess(player1ID, player2ID, game); err != nil {
		s.logger.Error().Err(err).Msg("Failed to notify players about match")
		// Game is created but notification failed - could be handled differently
		return err
	}

	s.logger.Info().
		Str("gameID", game.ID.String()).
		Str("player1ID", player1ID.String()).
		Str("player2ID", player2ID.String()).
		Msg("Match created successfully")

	return nil
}

// notifyMatchSuccess sends match found notifications to both players
func (s *matchmakingService) notifyMatchSuccess(player1ID, player2ID uuid.UUID, game interface{}) error {
	// TODO: Implement proper notification system
	// For now, just log the successful match
	s.logger.Info().
		Str("player1ID", player1ID.String()).
		Str("player2ID", player2ID.String()).
		Msg("Match created successfully - notifications to be implemented")

	return nil
}

// SetWebSocketService sets the WebSocket service (to avoid circular dependency)
func (s *matchmakingService) SetWebSocketService(wsService WebSocketService) {
	s.wsService = wsService
}

// notifyMatchError sends error notifications to both players
func (s *matchmakingService) notifyMatchError(player1ID, player2ID uuid.UUID, message string) error {
	errorMsg := map[string]interface{}{
		"type":    "match_error",
		"message": message,
	}

	msgBytes, err := json.Marshal(errorMsg)
	if err != nil {
		return err
	}

	// Send error to both players
	tempGameID := uuid.New()
	s.wsService.BroadcastToGame(tempGameID, msgBytes)

	return nil
}
