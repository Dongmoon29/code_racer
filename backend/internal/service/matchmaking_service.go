package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
)

// MatchmakingService handles player matching and game creation
type MatchmakingService interface {
	CreateMatch(player1ID, player2ID uuid.UUID, difficulty string) (interface{}, error)
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
func (s *matchmakingService) CreateMatch(player1ID, player2ID uuid.UUID, difficulty string) (interface{}, error) {
	s.logger.Info().
		Str("player1ID", player1ID.String()).
		Str("player2ID", player2ID.String()).
		Str("difficulty", difficulty).
		Msg("Starting match creation")

	// 1. Create the actual game
	game, err := s.gameService.CreateGameForMatch(player1ID, player2ID, difficulty)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to create game for match")
		s.notifyMatchError(player1ID, player2ID, "Failed to create game")
		return nil, err
	}

	s.logger.Info().
		Str("gameID", game.ID.String()).
		Str("player1ID", player1ID.String()).
		Str("player2ID", player2ID.String()).
		Msg("Match created successfully")

	return game, nil
}

// notifyMatchSuccess sends match found notifications to both players
func (s *matchmakingService) notifyMatchSuccess(player1ID, player2ID uuid.UUID, game interface{}) error {
	// Type assertion to get the actual game
	actualGame, ok := game.(*model.Game)
	if !ok {
		s.logger.Error().Msg("Failed to cast game to *model.Game")
		return fmt.Errorf("invalid game type")
	}

	// Create match found messages for both players
	matchMsg1 := MatchFoundMessage{
		Type:   "match_found",
		GameID: actualGame.ID.String(),
		Problem: map[string]interface{}{
			"id":          actualGame.LeetCode.ID.String(),
			"title":       actualGame.LeetCode.Title,
			"difficulty":  actualGame.LeetCode.Difficulty,
			"description": actualGame.LeetCode.Description,
		},
		Opponent: map[string]interface{}{
			"id":   player2ID.String(),
			"name": "Player 2", // TODO: Get actual user name
		},
	}

	matchMsg2 := MatchFoundMessage{
		Type:   "match_found",
		GameID: actualGame.ID.String(),
		Problem: map[string]interface{}{
			"id":          actualGame.LeetCode.ID.String(),
			"title":       actualGame.LeetCode.Title,
			"difficulty":  actualGame.LeetCode.Difficulty,
			"description": actualGame.LeetCode.Description,
		},
		Opponent: map[string]interface{}{
			"id":   player1ID.String(),
			"name": "Player 1", // TODO: Get actual user name
		},
	}

	// For now, we'll handle notification through a different mechanism
	// The WebSocket Hub should handle the client notification directly
	// Store match result for clients to check
	ctx := context.Background()
	matchKey1 := fmt.Sprintf("match_result:%s", player1ID.String())
	matchKey2 := fmt.Sprintf("match_result:%s", player2ID.String())

	if msgBytes1, err := json.Marshal(matchMsg1); err == nil {
		s.rdb.Set(ctx, matchKey1, string(msgBytes1), 5*time.Minute)
	}

	if msgBytes2, err := json.Marshal(matchMsg2); err == nil {
		s.rdb.Set(ctx, matchKey2, string(msgBytes2), 5*time.Minute)
	}

	s.logger.Info().
		Str("gameID", actualGame.ID.String()).
		Str("player1ID", player1ID.String()).
		Str("player2ID", player2ID.String()).
		Msg("Match notifications sent successfully")

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
