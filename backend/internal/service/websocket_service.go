package service

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/events"
	"github.com/Dongmoon29/code_racer/internal/interfaces"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// Hub manages WebSocket connections
type Hub struct {
	// Map of registered clients
	clients map[*Client]bool

	// Map of clients by match ID
	matchClients map[string]map[*Client]bool

	// NEW: Matchmaking clients by mode and difficulty: mode -> difficulty -> clients
	matchingClients map[string]map[string][]*Client

	// Channel for client registration
	register chan *Client

	// Channel for client unregistration
	unregister chan *Client

	// Channel for broadcast messages
	broadcast chan *Message

	// Channel for match-specific broadcast messages
	matchBroadcast chan *MatchMessage

	// NEW: Matchmaking channels
	startMatching  chan *MatchingRequest
	cancelMatching chan *CancelRequest

	// Matchmaking service for handling matches
	matchmakingService MatchmakingService

	// User repository for getting user information
	userRepository interfaces.UserRepository

	// Logger for structured logging
	logger logger.Logger

	// Mutex lock
	mu sync.RWMutex
	
	// Shutdown channel for graceful shutdown
	shutdown chan struct{}
}

// Client represents a WebSocket client
type Client struct {
	// Hub reference
	hub *Hub

	// WebSocket connection
	conn *websocket.Conn

	// Message send channel
	send chan []byte

	// User ID
	userID uuid.UUID

	// Match ID
	matchID uuid.UUID

	// NEW: Matching state
	isMatching   bool
	difficulty   string
	matchStarted time.Time
	mode         string

	// NEW: Flag to indicate if disconnect is after successful match
	disconnectAfterMatch bool
}

// Message represents a broadcast message
type Message struct {
	// Message content
	data []byte
}

// GameMessage represents a game-specific broadcast message
type MatchMessage struct {
	// Match ID
	matchID uuid.UUID

	// Message content
	data []byte
}

// CodeUpdateMessage represents a code update message
type CodeUpdateMessage struct {
	Type    string `json:"type"`
	MatchID string `json:"match_id"`
	UserID  string `json:"user_id"`
	Code    string `json:"code"`
}

// NEW: Matchmaking message types
type MatchingRequest struct {
	Client     *Client `json:"-"`
	Difficulty string  `json:"difficulty"`
	Mode       string  `json:"mode"`
}

type CancelRequest struct {
	Client *Client `json:"-"`
}

type MatchingStatusMessage struct {
	Type          string `json:"type"`
	Status        string `json:"status"`
	QueuePos      int    `json:"queue_position,omitempty"`
	WaitTime      int    `json:"wait_time_seconds,omitempty"`
	EstimatedWait int    `json:"estimated_wait_seconds,omitempty"`
}

type MatchFoundMessage struct {
	Type     string      `json:"type"`
	GameID   string      `json:"game_id"`
	Problem  interface{} `json:"problem"`
	Opponent interface{} `json:"opponent"`
}

// WebSocketService interface for WebSocket operations
type WebSocketService interface {
	InitHub() *Hub
	HandleConnection(conn *websocket.Conn, userID uuid.UUID, matchID uuid.UUID)
	BroadcastToMatch(matchID uuid.UUID, message []byte)
	BroadcastToAllClients(message []byte)
}

// webSocketService implements WebSocketService interface
type webSocketService struct {
	rdb                *redis.Client
	redisManager       *RedisManager
	logger             logger.Logger
	hub                *Hub
	matchmakingService MatchmakingService
	userRepository     interfaces.UserRepository
	eventBus           events.EventBus
}

// NewWebSocketService creates a new WebSocketService instance
func NewWebSocketService(rdb *redis.Client, logger logger.Logger, matchmakingService MatchmakingService, userRepository interfaces.UserRepository, eventBus events.EventBus) WebSocketService {
	service := &webSocketService{
		rdb:                rdb,
		redisManager:       NewRedisManager(rdb, logger),
		logger:             logger,
		matchmakingService: matchmakingService,
		userRepository:     userRepository,
		eventBus:           eventBus,
	}
	service.InitHub()
	service.subscribeToEvents()
	return service
}

// subscribeToEvents registers event handlers on the event bus
func (s *webSocketService) subscribeToEvents() {
	if s.eventBus == nil {
		return
	}
	s.eventBus.Subscribe(events.TopicMatchCreated, func(payload interface{}) {
		evt, ok := payload.(*events.MatchCreatedEvent)
		if !ok || evt == nil || evt.Match == nil {
			return
		}
		// Broadcast a simple notification to the match room if any clients joined already
		msg := map[string]interface{}{
			"type":    constants.MatchFound,
			"game_id": evt.Match.ID.String(),
		}
		if msgBytes, err := json.Marshal(msg); err == nil {
			s.hub.matchBroadcast <- &MatchMessage{matchID: evt.Match.ID, data: msgBytes}
		}
	})

	s.eventBus.Subscribe(events.TopicGameFinished, func(payload interface{}) {
		evt, ok := payload.(*events.GameFinishedEvent)
		if !ok || evt == nil {
			return
		}
		// Broadcast the same message used elsewhere
		msg := map[string]interface{}{
			"type":      constants.GameFinished,
			"game_id":   evt.MatchID,
			"winner_id": evt.WinnerID,
		}
		if msgBytes, err := json.Marshal(msg); err == nil {
			if matchID, err := uuid.Parse(evt.MatchID); err == nil {
				s.hub.matchBroadcast <- &MatchMessage{matchID: matchID, data: msgBytes}
			}
		}
	})

	// Realtime judge events
	s.eventBus.Subscribe(events.TopicSubmissionStarted, func(payload interface{}) {
		evt, ok := payload.(*events.SubmissionStartedEvent)
		if !ok || evt == nil {
			return
		}
		msg := map[string]interface{}{
			"type":             constants.SubmissionStarted,
			"match_id":         evt.MatchID,
			"user_id":          evt.UserID,
			"status":           "started",
			"total_test_cases": evt.TotalTestCases,
			"message":          "Code submission started...",
			"timestamp":        time.Now().Unix(),
		}
		if msgBytes, err := json.Marshal(msg); err == nil {
			if matchID, err := uuid.Parse(evt.MatchID); err == nil {
				s.hub.matchBroadcast <- &MatchMessage{matchID: matchID, data: msgBytes}
			}
		}
	})

	s.eventBus.Subscribe(events.TopicTestCaseRunning, func(payload interface{}) {
		evt, ok := payload.(*events.TestCaseRunningEvent)
		if !ok || evt == nil {
			return
		}
		msg := map[string]interface{}{
			"type":             constants.TestCaseRunning,
			"match_id":         evt.MatchID,
			"user_id":          evt.UserID,
			"test_case_index":  evt.TestCaseIndex,
			"total_test_cases": evt.Total,
			"status":           "running",
			"input":            evt.TestCase,
			"timestamp":        time.Now().Unix(),
		}
		if msgBytes, err := json.Marshal(msg); err == nil {
			if matchID, err := uuid.Parse(evt.MatchID); err == nil {
				s.hub.matchBroadcast <- &MatchMessage{matchID: matchID, data: msgBytes}
			}
		}
	})

	s.eventBus.Subscribe(events.TopicTestCaseCompleted, func(payload interface{}) {
		evt, ok := payload.(*events.TestCaseCompletedEvent)
		if !ok || evt == nil {
			return
		}
		msg := map[string]interface{}{
			"type":            constants.TestCaseCompleted,
			"match_id":        evt.MatchID,
			"user_id":         evt.UserID,
			"test_case_index": evt.TestCaseIndex,
			"status":          "completed",
			"input":           evt.Input,
			"expected":        evt.Expected,
			"actual":          evt.Actual,
			"passed":          evt.Passed,
			"execution_time":  evt.ExecutionTime,
			"memory_usage":    evt.MemoryUsage,
			"timestamp":       time.Now().Unix(),
		}
		if msgBytes, err := json.Marshal(msg); err == nil {
			if matchID, err := uuid.Parse(evt.MatchID); err == nil {
				s.hub.matchBroadcast <- &MatchMessage{matchID: matchID, data: msgBytes}
			}
		}
	})

	s.eventBus.Subscribe(events.TopicSubmissionCompleted, func(payload interface{}) {
		evt, ok := payload.(*events.SubmissionCompletedEvent)
		if !ok || evt == nil {
			return
		}
		msg := map[string]interface{}{
			"type":              constants.SubmissionCompleted,
			"match_id":          evt.MatchID,
			"user_id":           evt.UserID,
			"status":            "completed",
			"passed":            evt.Passed,
			"total_test_cases":  evt.TotalCount,
			"passed_test_cases": evt.PassedCount,
			"execution_time":    evt.ExecutionTime,
			"memory_usage":      evt.MemoryUsage,
			"message": func() string {
				if evt.Passed {
					return "All test cases passed!"
				}
				return fmt.Sprintf("%d/%d test cases passed.", evt.PassedCount, evt.TotalCount)
			}(),
			"timestamp": time.Now().Unix(),
		}
		if msgBytes, err := json.Marshal(msg); err == nil {
			if matchID, err := uuid.Parse(evt.MatchID); err == nil {
				s.hub.matchBroadcast <- &MatchMessage{matchID: matchID, data: msgBytes}
			}
		}
	})

	s.eventBus.Subscribe(events.TopicSubmissionFailed, func(payload interface{}) {
		evt, ok := payload.(*events.SubmissionFailedEvent)
		if !ok || evt == nil {
			return
		}
		msg := map[string]interface{}{
			"type":      constants.SubmissionFailed,
			"match_id":  evt.MatchID,
			"user_id":   evt.UserID,
			"status":    "failed",
			"message":   evt.Message,
			"timestamp": time.Now().Unix(),
		}
		if msgBytes, err := json.Marshal(msg); err == nil {
			if matchID, err := uuid.Parse(evt.MatchID); err == nil {
				s.hub.matchBroadcast <- &MatchMessage{matchID: matchID, data: msgBytes}
			}
		}
	})

	s.eventBus.Subscribe(events.TopicJudge0Timeout, func(payload interface{}) {
		msg := map[string]interface{}{
			"type":    constants.Judge0TimeoutError,
			"message": "Judge0 API is not responding. Please try again later.",
			"details": "Temporary issue with the code execution service.",
		}
		if msgBytes, err := json.Marshal(msg); err == nil {
			s.hub.broadcastToAllClients(msgBytes)
		}
	})

	s.eventBus.Subscribe(events.TopicJudge0Quota, func(payload interface{}) {
		msg := map[string]interface{}{
			"type":    constants.Judge0QuotaError,
			"message": "Judge0 API daily quota exceeded. Please try again tomorrow.",
			"details": "The code execution service has reached its daily usage limit.",
		}
		if msgBytes, err := json.Marshal(msg); err == nil {
			s.hub.broadcastToAllClients(msgBytes)
		}
	})
}

// InitHub initializes the WebSocket hub
func (s *webSocketService) InitHub() *Hub {
	s.hub = &Hub{
		clients:            make(map[*Client]bool),
		matchClients:       make(map[string]map[*Client]bool),
		matchingClients:    make(map[string]map[string][]*Client),
		register:           make(chan *Client),
		unregister:         make(chan *Client),
		broadcast:          make(chan *Message),
		matchBroadcast:     make(chan *MatchMessage),
		startMatching:      make(chan *MatchingRequest),
		cancelMatching:     make(chan *CancelRequest),
		matchmakingService: s.matchmakingService,
		userRepository:     s.userRepository,
		logger:             s.logger,
		shutdown:           make(chan struct{}),
	}
	return s.hub
}

// registerClient adds a new client to the hub
func (h *Hub) registerClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Add client to global clients map
	h.clients[client] = true

	// Add client to match-specific map
	h.addClientToMatch(client)
}

// unregisterClient removes a client from the hub
func (h *Hub) unregisterClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	// Check if client exists in global map
	if _, clientExists := h.clients[client]; !clientExists {
		return
	}

	// Log disconnect reason for debugging
	h.logClientDisconnectReason(client)

	// Remove from global clients map
	delete(h.clients, client)
	close(client.send)

	// Remove from match-specific map
	h.removeClientFromMatch(client)

	// Also remove from matchmaking queue if the client was matching
	// Skip queue removal if disconnect is after successful match
	if client.isMatching && !client.disconnectAfterMatch {
		h.removeFromMatchingQueue(client)
		client.isMatching = false
		client.difficulty = ""
	}
}

// logClientDisconnectReason logs the reason for client disconnection
func (h *Hub) logClientDisconnectReason(client *Client) {
	if client.disconnectAfterMatch {
		h.logger.Info().Str("userID", client.userID.String()).Msg("Client disconnected after successful match")
	} else if client.isMatching {
		h.logger.Warn().Str("userID", client.userID.String()).Str("difficulty", client.difficulty).Msg("Client disconnected while matching")
	} else {
		h.logger.Info().Str("userID", client.userID.String()).Msg("Client disconnected normally")
	}
}

// addClientToMatch adds a client to the match-specific client map
func (h *Hub) addClientToMatch(client *Client) {
	matchID := client.matchID.String()
	if _, exists := h.matchClients[matchID]; !exists {
		h.matchClients[matchID] = make(map[*Client]bool)
	}
	h.matchClients[matchID][client] = true
}

// removeClientFromMatch removes a client from the match-specific client map
func (h *Hub) removeClientFromMatch(client *Client) {
	matchID := client.matchID.String()
	matchClients, exists := h.matchClients[matchID]
	if !exists {
		return
	}
	delete(matchClients, client)
	if len(matchClients) == 0 {
		delete(h.matchClients, matchID)
	}
}

// cleanupDeadClient safely removes a dead client while handling lock transitions
func (h *Hub) cleanupDeadClient(client *Client) {
	// Remove from global clients map
	delete(h.clients, client)
	close(client.send)

	// Remove from match-specific map
	h.removeClientFromMatch(client)

	// Remove from matching queue if applicable
	if client.isMatching {
		h.removeFromMatchingQueue(client)
	}
}

// handleStartMatching processes a matching request
func (h *Hub) handleStartMatching(req *MatchingRequest) {
	h.logMatchingRequest(req)

	h.mu.Lock()
	defer h.mu.Unlock()

	matchingClient := req.Client
	requestedDifficulty := req.Difficulty
	requestedMode := req.Mode
	h.updateClientMatchingState(matchingClient, requestedDifficulty, requestedMode)
	h.addClientToMatchingQueue(matchingClient, requestedDifficulty, requestedMode)
	h.sendMatchingStatusToClient(matchingClient, requestedDifficulty, requestedMode)
	h.attemptImmediateMatchmaking(requestedDifficulty, requestedMode)
}

// logMatchingRequest logs the matching request details
func (h *Hub) logMatchingRequest(req *MatchingRequest) {
	h.logger.Info().Str("userID", req.Client.userID.String()).Str("difficulty", req.Difficulty).Msg("Starting matchmaking")
}

// updateClientMatchingState updates the client's matching state
func (h *Hub) updateClientMatchingState(client *Client, difficulty, mode string) {
	client.isMatching = true
	client.difficulty = difficulty
	client.mode = mode
	client.matchStarted = time.Now()
}

// addClientToMatchingQueue adds client to the matching queue
func (h *Hub) addClientToMatchingQueue(client *Client, difficulty, mode string) {
	// Prevent duplicate queue entries by removing any existing occurrence first
	h.removeFromMatchingQueue(client)

	// Add to matching queue
	if _, ok := h.matchingClients[mode]; !ok {
		h.matchingClients[mode] = make(map[string][]*Client)
	}
	h.matchingClients[mode][difficulty] = append(h.matchingClients[mode][difficulty], client)
	h.logger.Info().Str("mode", mode).Str("difficulty", difficulty).Int("queueSize", len(h.matchingClients[mode][difficulty])).Msg("Client added to matching queue")
}

// sendMatchingStatusToClient sends matching status to the client
func (h *Hub) sendMatchingStatusToClient(client *Client, difficulty, mode string) {
	queuePosition := 0
	if qs, ok := h.matchingClients[mode]; ok {
		queuePosition = len(qs[difficulty])
	}
	h.sendMatchingStatus(client, "searching", queuePosition, 0)
	h.logger.Debug().Str("userID", client.userID.String()).Int("queuePosition", queuePosition).Msg("Sent matching status to client")
}

// attemptImmediateMatchmaking tries to find a match immediately
func (h *Hub) attemptImmediateMatchmaking(difficulty, mode string) {
	h.tryMatchmaking(difficulty, mode)
}

// handleCancelMatching processes a cancel matching request
func (h *Hub) handleCancelMatching(req *CancelRequest) {
	h.mu.Lock()
	defer h.mu.Unlock()

	client := req.Client
	if !client.isMatching {
		return
	}

	// Remove from matching queue
	h.removeFromMatchingQueue(client)

	// Update client state
	client.isMatching = false
	client.difficulty = ""
	client.mode = ""

	// Send cancellation confirmation
	h.sendMatchingStatus(client, "canceled", 0, 0)
}

// removeFromMatchingQueue removes a client from all matching queues
func (h *Hub) removeFromMatchingQueue(client *Client) {
	// Prefer removing from the specific mode/difficulty bucket
	if qs, ok := h.matchingClients[client.mode]; ok {
		if clients, ok2 := qs[client.difficulty]; ok2 {
			for i, c := range clients {
				if c == client {
					h.matchingClients[client.mode][client.difficulty] = append(clients[:i], clients[i+1:]...)
					break
				}
			}
			if len(h.matchingClients[client.mode][client.difficulty]) == 0 {
				delete(h.matchingClients[client.mode], client.difficulty)
			}
		}
		if len(h.matchingClients[client.mode]) == 0 {
			delete(h.matchingClients, client.mode)
		}
		return
	}
	// Fallback: scan all queues if mode/difficulty missing
	for mode, byDiff := range h.matchingClients {
		for difficulty, clients := range byDiff {
			for i, c := range clients {
				if c == client {
					h.matchingClients[mode][difficulty] = append(clients[:i], clients[i+1:]...)
					break
				}
			}
			if len(h.matchingClients[mode][difficulty]) == 0 {
				delete(h.matchingClients[mode], difficulty)
			}
		}
		if len(h.matchingClients[mode]) == 0 {
			delete(h.matchingClients, mode)
		}
	}
}

// tryMatchmaking attempts to match waiting clients
func (h *Hub) tryMatchmaking(difficulty, mode string) {
	byDiff, ok := h.matchingClients[mode]
	if !ok {
		return
	}
	clients := byDiff[difficulty]

	// Need at least 2 clients to match
	if len(clients) < 2 {
		return
	}

	// Match first two clients (FIFO)
	player1 := clients[0]
	player2 := clients[1]

	// Remove matched clients from queue
	h.matchingClients[mode][difficulty] = clients[2:]
	if len(h.matchingClients[mode][difficulty]) == 0 {
		delete(h.matchingClients[mode], difficulty)
		if len(h.matchingClients[mode]) == 0 {
			delete(h.matchingClients, mode)
		}
	}

	// Create game and notify clients
	go h.createMatchedGame(player1, player2, difficulty)
}

// sendMatchingStatus sends matching status to a client
func (h *Hub) sendMatchingStatus(client *Client, status string, queuePos, waitTime int) {
	msg := MatchingStatusMessage{
		Type:     constants.MatchingStatus,
		Status:   status,
		QueuePos: queuePos,
		WaitTime: waitTime,
	}

	if msgBytes, err := json.Marshal(msg); err == nil {
		select {
		case client.send <- msgBytes:
		default:
			// Client disconnected, will be cleaned up elsewhere
		}
	}
}

// createMatchedGame delegates match creation to MatchmakingService
func (h *Hub) createMatchedGame(player1, player2 *Client, difficulty string) {
	// Update client states
	player1.isMatching = false
	player2.isMatching = false

	// Mark clients for disconnect after match (to avoid queue cleanup)
	player1.disconnectAfterMatch = true
	player2.disconnectAfterMatch = true

	// Create the actual game
	mode := player1.mode
	if mode == "" {
		mode = "casual_pvp"
	}
	game, err := h.matchmakingService.CreateMatch(player1.userID, player2.userID, difficulty, mode)
	if err != nil {
		// Reset flags on error
		player1.disconnectAfterMatch = false
		player2.disconnectAfterMatch = false

		// Send error to both players
		errorMsg := map[string]interface{}{
			"type":    constants.Error,
			"message": "Failed to create game. Please try again.",
		}

		if msgBytes, err := json.Marshal(errorMsg); err == nil {
			select {
			case player1.send <- msgBytes:
			default:
			}
			select {
			case player2.send <- msgBytes:
			default:
			}
		}

		// Return players to matching queue on error (preserve mode bucket)
		h.mu.Lock()
		mode := player1.mode
		if _, ok := h.matchingClients[mode]; !ok {
			h.matchingClients[mode] = make(map[string][]*Client)
		}
		current := h.matchingClients[mode][difficulty]
		h.matchingClients[mode][difficulty] = append([]*Client{player1, player2}, current...)
		player1.isMatching = true
		player2.isMatching = true
		h.mu.Unlock()
		return
	}

	// Send match found notifications directly to clients
	h.sendMatchFoundNotifications(player1, player2, game)
}

// sendMatchFoundNotifications sends match found messages to both players
func (h *Hub) sendMatchFoundNotifications(player1, player2 *Client, match interface{}) {
	// Type assertion to get the actual game
	actualMatch, ok := match.(*model.Match)
	if !ok {
		// Send simple notification without game details
		simpleMsg := map[string]interface{}{
			"type":    constants.MatchFound,
			"message": "Match found! Redirecting to game...",
		}

		if msgBytes, err := json.Marshal(simpleMsg); err == nil {
			select {
			case player1.send <- msgBytes:
			default:
			}
			select {
			case player2.send <- msgBytes:
			default:
			}
		}
		return
	}

	// Get user names for both players
	player1User, err1 := h.userRepository.FindByID(player1.userID)
	player2User, err2 := h.userRepository.FindByID(player2.userID)

	// Use default names if user lookup fails
	player1Name := "Player 1"
	player2Name := "Player 2"

	if err1 == nil && player1User != nil {
		player1Name = player1User.Name
	}
	if err2 == nil && player2User != nil {
		player2Name = player2User.Name
	}

	// Create detailed match found messages
	matchMsg1 := MatchFoundMessage{
		Type:   constants.MatchFound,
		GameID: actualMatch.ID.String(),
		Problem: map[string]interface{}{
			"id":          actualMatch.Problem.ID.String(),
			"title":       actualMatch.Problem.Title,
			"difficulty":  string(actualMatch.Problem.Difficulty),
			"description": actualMatch.Problem.Description,
		},
		Opponent: map[string]interface{}{
			"id":   player2.userID.String(),
			"name": player2Name,
		},
	}

	matchMsg2 := MatchFoundMessage{
		Type:   constants.MatchFound,
		GameID: actualMatch.ID.String(),
		Problem: map[string]interface{}{
			"id":          actualMatch.Problem.ID.String(),
			"title":       actualMatch.Problem.Title,
			"difficulty":  string(actualMatch.Problem.Difficulty),
			"description": actualMatch.Problem.Description,
		},
		Opponent: map[string]interface{}{
			"id":   player1.userID.String(),
			"name": player1Name,
		},
	}

	// Send to both players
	h.sendMatchFoundMessageToPlayer(player1, matchMsg1, "player1")
	h.sendMatchFoundMessageToPlayer(player2, matchMsg2, "player2")

	// Do not mutate matchmaking connections into game connections here.
	// Clients should open a dedicated game WebSocket using /ws/:matchId after receiving match_found.
}

// sendMatchFoundMessageToPlayer sends match found message to a specific player
func (h *Hub) sendMatchFoundMessageToPlayer(player *Client, message MatchFoundMessage, playerLabel string) {
	if msgBytes, err := json.Marshal(message); err == nil {
		select {
		case player.send <- msgBytes:
			h.logger.Info().Str("playerLabel", playerLabel).Str("userID", player.userID.String()).Msg("Match found message sent successfully")
		default:
			h.logger.Warn().Str("playerLabel", playerLabel).Str("userID", player.userID.String()).Msg("Failed to send match found message (channel blocked)")
		}
	} else {
		h.logger.Error().Err(err).Str("playerLabel", playerLabel).Str("userID", player.userID.String()).Msg("Failed to marshal match found message")
	}
}

// broadcastToAllClients sends a message to all connected clients
func (h *Hub) broadcastToAllClients(data []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	var deadClients []*Client

	for client := range h.clients {
		select {
		case client.send <- data:
			// Message sent successfully
		default:
			// Client's send channel is blocked, mark as dead
			deadClients = append(deadClients, client)
		}
	}

	// Clean up dead clients
	if len(deadClients) > 0 {
		h.mu.RUnlock()
		h.mu.Lock()
		for _, deadClient := range deadClients {
			h.cleanupDeadClient(deadClient)
		}
		h.mu.Unlock()
		h.mu.RLock()
	}
}

// broadcastToMatchClients sends a message to all clients in a specific match
func (h *Hub) broadcastToMatchClients(matchID uuid.UUID, data []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	matchIDStr := matchID.String()
	matchClients, exists := h.matchClients[matchIDStr]
	if !exists {
		return
	}

	var deadClients []*Client

	for client := range matchClients {
		select {
		case client.send <- data:
			// Message sent successfully
		default:
			// Client's send channel is blocked, mark as dead
			deadClients = append(deadClients, client)
		}
	}

	// Clean up dead clients
	if len(deadClients) > 0 {
		h.mu.RUnlock()
		h.mu.Lock()
		for _, deadClient := range deadClients {
			h.cleanupDeadClient(deadClient)
		}
		h.mu.Unlock()
		h.mu.RLock()
	}
}

// Run starts the hub's main event loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.registerClient(client)

		case client := <-h.unregister:
			h.unregisterClient(client)

		case message := <-h.broadcast:
			h.broadcastToAllClients(message.data)

		case matchMessage := <-h.matchBroadcast:
			h.broadcastToMatchClients(matchMessage.matchID, matchMessage.data)

		case matchReq := <-h.startMatching:
			h.handleStartMatching(matchReq)

		case cancelReq := <-h.cancelMatching:
			h.handleCancelMatching(cancelReq)
			
		case <-h.shutdown:
			h.logger.Info().Msg("WebSocket hub shutting down")
			// Close all client connections
			h.mu.Lock()
			for client := range h.clients {
				close(client.send)
				client.conn.Close()
			}
			h.mu.Unlock()
			return
		}
	}
}

// Shutdown gracefully shuts down the hub
func (h *Hub) Shutdown() {
	h.logger.Info().Msg("Initiating WebSocket hub shutdown")
	close(h.shutdown)
}

// HandleConnection handles a new WebSocket connection
func (s *webSocketService) HandleConnection(conn *websocket.Conn, userID uuid.UUID, matchID uuid.UUID) {
	client := s.createWebSocketClient(conn, userID, matchID)
	s.registerClientWithHub(client)
	s.loadExistingCodeForClient(client, matchID, userID)
	s.addUserToMatchParticipants(matchID, userID)
	s.startClientGoroutines(client)
}

// createWebSocketClient creates a new WebSocket client
func (s *webSocketService) createWebSocketClient(conn *websocket.Conn, userID uuid.UUID, matchID uuid.UUID) *Client {
	return &Client{
		hub:     s.hub,
		conn:    conn,
		send:    make(chan []byte, constants.ClientSendBufferSize),
		userID:  userID,
		matchID: matchID,
	}
}

// registerClientWithHub registers the client with the hub
func (s *webSocketService) registerClientWithHub(client *Client) {
	client.hub.register <- client
}

// loadExistingCodeForClient loads and sends existing code to the client
func (s *webSocketService) loadExistingCodeForClient(client *Client, matchID uuid.UUID, userID uuid.UUID) {
	// Skip loading code if this is a matchmaking session (nil UUID)
	if matchID == uuid.Nil {
		s.logger.Info().
			Str("userID", userID.String()).
			Msg("User in matchmaking - skipping code loading")
		return
	}

	existingCode, err := s.redisManager.GetUserCode(matchID, userID)
	if err == nil && existingCode != "" {
		codeUpdateMsg := CodeUpdateMessage{
			Type:    constants.CodeUpdate,
			MatchID: matchID.String(),
			UserID:  userID.String(),
			Code:    existingCode,
		}
		msgBytes, _ := json.Marshal(codeUpdateMsg)
		client.send <- msgBytes
	}
}

// addUserToMatchParticipants adds user to the match participants list
func (s *webSocketService) addUserToMatchParticipants(matchID uuid.UUID, userID uuid.UUID) {
	// Skip adding to Redis if this is a matchmaking session (nil UUID)
	if matchID == uuid.Nil {
		s.logger.Info().
			Str("userID", userID.String()).
			Msg("User in matchmaking - skipping Redis participant addition")
		return
	}

	// Use RedisManager to add user to match
	// This will be handled by the match creation process
	s.logger.Info().
		Str("matchID", matchID.String()).
		Str("userID", userID.String()).
		Msg("User added to match participants")
}

// startClientGoroutines starts the read and write pumps for the client
func (s *webSocketService) startClientGoroutines(client *Client) {
	go client.readPump(s)
	go client.writePump()
}

// BroadcastToGame broadcasts a message to all clients in a specific game
func (s *webSocketService) BroadcastToMatch(matchID uuid.UUID, message []byte) {
	s.hub.matchBroadcast <- &MatchMessage{matchID: matchID, data: message}
}

func (s *webSocketService) BroadcastToAllClients(message []byte) {
	s.hub.broadcastToAllClients(message)
}

// cleanupUserData cleans up user data from Redis when WebSocket connection is closed
func (s *webSocketService) cleanupUserData(userID uuid.UUID, matchID uuid.UUID) {
	// Ignore cleanup for matchmaking pseudo-room
	if matchID == uuid.Nil {
		return
	}

	ctx := context.Background()
	cleanupPipeline := s.rdb.Pipeline()

	s.removeUserFromMatchParticipants(cleanupPipeline, ctx, matchID, userID)
	s.cleanupUserCodeData(cleanupPipeline, ctx, matchID, userID)
	s.cleanupEmptyMatchIfNeeded(cleanupPipeline, ctx, matchID)
	s.executeCleanupPipeline(cleanupPipeline, ctx, userID, matchID)
}

// removeUserFromMatchParticipants removes user from match participants list
func (s *webSocketService) removeUserFromMatchParticipants(pipe redis.Pipeliner, ctx context.Context, matchID uuid.UUID, userID uuid.UUID) {
	matchUsersKey := fmt.Sprintf("match:%s:users", matchID.String())
	pipe.SRem(ctx, matchUsersKey, userID.String())
}

// cleanupUserCodeData cleans up user code data based on match status
func (s *webSocketService) cleanupUserCodeData(pipe redis.Pipeliner, ctx context.Context, matchID uuid.UUID, userID uuid.UUID) {
	// Get match metadata to determine if code should be deleted
	metadata, err := s.redisManager.GetMatchMetadata(matchID)
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to get match metadata during cleanup")
		return
	}

	status, exists := metadata["status"]
	if !exists {
		s.logger.Warn().Msg("Match status not found during cleanup")
		return
	}

	// Delete code data only if match is waiting, finished, or closed
	if s.shouldDeleteCodeData(status) {
		// Remove user code using pipeline for consistency
		userCodeKey := fmt.Sprintf("match:%s:user:%s:code", matchID.String(), userID.String())
		pipe.Del(ctx, userCodeKey)
	}
}

// shouldDeleteCodeData determines if code data should be deleted based on match status
func (s *webSocketService) shouldDeleteCodeData(matchStatus string) bool {
	return matchStatus == string(model.MatchStatusWaiting) ||
		matchStatus == string(model.MatchStatusFinished) ||
		matchStatus == string(model.MatchStatusClosed)
}

// cleanupEmptyMatchIfNeeded cleans up match data if no users remain
func (s *webSocketService) cleanupEmptyMatchIfNeeded(pipe redis.Pipeliner, ctx context.Context, matchID uuid.UUID) {
	matchUsersKey := fmt.Sprintf("match:%s:users", matchID.String())
	remainingUserCount, err := s.rdb.SCard(ctx, matchUsersKey).Result()
	if err != nil || remainingUserCount > 1 {
		return
	}

	// Get match status
	matchKey := fmt.Sprintf("match:%s", matchID.String())
	matchStatus, err := s.rdb.HGet(ctx, matchKey, "status").Result()
	if err != nil {
		return
	}

	// Clean up waiting matches completely
	if matchStatus == string(model.MatchStatusWaiting) {
		s.cleanupWaitingMatch(pipe, ctx, matchID, matchKey, matchUsersKey)
	}
}

// cleanupWaitingMatch performs complete cleanup for waiting matches
func (s *webSocketService) cleanupWaitingMatch(pipe redis.Pipeliner, ctx context.Context, matchID uuid.UUID, matchKey, matchUsersKey string) {
	pipe.Del(ctx, matchKey)
	pipe.Del(ctx, matchUsersKey)

	// Delete all user code data
	remainingUsers, err := s.rdb.SMembers(ctx, matchUsersKey).Result()
	if err != nil {
		s.logger.Error().Err(err).Str("matchID", matchID.String()).Msg("Failed to get remaining users for cleanup")
		return
	}

	for _, userID := range remainingUsers {
		userCodeKey := fmt.Sprintf("match:%s:user:%s:code", matchID.String(), userID)
		pipe.Del(ctx, userCodeKey)
	}
}

// executeCleanupPipeline executes the Redis pipeline and logs results
func (s *webSocketService) executeCleanupPipeline(pipe redis.Pipeliner, ctx context.Context, userID uuid.UUID, matchID uuid.UUID) {
	if _, err := pipe.Exec(ctx); err != nil {
		s.logger.Error().Err(err).Str("userID", userID.String()).Str("matchID", matchID.String()).Msg("Failed to cleanup user data in Redis")
	} else {
		s.logger.Debug().Str("userID", userID.String()).Str("matchID", matchID.String()).Msg("Successfully cleaned up user data in Redis")
	}
}

// readPump reads messages from the client
func (c *Client) readPump(wsService *webSocketService) {
	defer c.handleReadPumpCleanup(wsService)

	c.setupReadPumpConnection()

	for {
		message, err := c.readMessage()
		if err != nil {
			wsService.logger.Debug().Err(err).Msg("WebSocket read error, closing connection")
			break
		}

		msg, msgType := c.parseMessage(message)
		if msg == nil {
			continue
		}

		c.handleMessageByType(msgType, msg, wsService)
	}
}

// handleReadPumpCleanup handles cleanup when readPump exits
func (c *Client) handleReadPumpCleanup(wsService *webSocketService) {
	if r := recover(); r != nil {
		wsService.logger.Error().Interface("panic", r).Msg("Recovered from panic in readPump")
	}
	c.hub.unregister <- c
	c.conn.Close()
	wsService.cleanupUserData(c.userID, c.matchID)
}

// setupReadPumpConnection configures WebSocket connection settings
func (c *Client) setupReadPumpConnection() {
	c.conn.SetReadLimit(constants.MaxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(constants.PongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(constants.PongWait))
		return nil
	})
}

// readMessage reads a single message from the WebSocket connection
func (c *Client) readMessage() ([]byte, error) {
	_, message, err := c.conn.ReadMessage()
	return message, err
}

// parseMessage parses JSON message and extracts message type
func (c *Client) parseMessage(message []byte) (map[string]interface{}, string) {
	var msg map[string]interface{}
	if err := json.Unmarshal(message, &msg); err != nil {
		// Don't log message parsing failures (client errors)
		return nil, ""
	}

	msgType, ok := msg["type"].(string)
	if !ok {
		// Don't log invalid message types
		return nil, ""
	}

	return msg, msgType
}

// handleMessageByType routes messages to appropriate handlers based on type
func (c *Client) handleMessageByType(msgType string, msg map[string]interface{}, wsService *webSocketService) {
	switch msgType {
	case constants.Auth:
		// Handle auth message (already authenticated at connection time)
		// Logging removed

	case constants.Ping:
		c.handlePingMessage()

	case constants.StartMatching:
		c.handleStartMatchingMessage(msg)

	case constants.CancelMatching:
		c.handleCancelMatchingMessage()

	case constants.CodeUpdate:
		c.handleCodeUpdateMessage(msg, wsService)

	default:
		// Don't log unknown message types
	}
}

// handlePingMessage responds to ping messages with pong
func (c *Client) handlePingMessage() {
	pongMsg := map[string]interface{}{
		"type":      constants.Pong,
		"timestamp": time.Now().Unix(),
	}
	pongBytes, _ := json.Marshal(pongMsg)
	c.send <- pongBytes
}

// handleStartMatchingMessage processes start matching messages
func (c *Client) handleStartMatchingMessage(msg map[string]interface{}) {
	c.hub.logger.Info().Interface("message", msg).Str("userID", c.userID.String()).Msg("Received start matching message")

	if difficulty, ok := msg["difficulty"].(string); ok {
		mode := "casual_pvp"
		if m, ok := msg["mode"].(string); ok && m != "" {
			mode = m
		}
		c.hub.logger.Info().Str("difficulty", difficulty).Str("userID", c.userID.String()).Msg("Extracted difficulty from message")

		if c.isValidDifficulty(difficulty) {
			c.hub.logger.Info().Str("userID", c.userID.String()).Str("difficulty", difficulty).Msg("Creating match request")
			matchReq := &MatchingRequest{
				Client:     c,
				Difficulty: difficulty,
				Mode:       mode,
			}
			c.hub.startMatching <- matchReq
			c.hub.logger.Info().Str("userID", c.userID.String()).Msg("Match request sent to hub")
		} else {
			c.hub.logger.Warn().Str("difficulty", difficulty).Str("userID", c.userID.String()).Msg("Invalid difficulty received")
		}
	} else {
		c.hub.logger.Error().Interface("message", msg).Str("userID", c.userID.String()).Msg("Failed to extract difficulty from message")
	}
}

// isValidDifficulty checks if the difficulty is valid
func (c *Client) isValidDifficulty(difficulty string) bool {
	return difficulty == "Easy" || difficulty == "Medium" || difficulty == "Hard"
}

// handleCancelMatchingMessage processes cancel matching messages
func (c *Client) handleCancelMatchingMessage() {
	c.hub.logger.Info().Str("userID", c.userID.String()).Msg("Handling cancel matching request")
	cancelReq := &CancelRequest{
		Client: c,
	}
	c.hub.cancelMatching <- cancelReq
}

// handleCodeUpdateMessage processes code update messages
func (c *Client) handleCodeUpdateMessage(msg map[string]interface{}, wsService *webSocketService) {
	if data, ok := msg["data"].(map[string]interface{}); ok {
		if code, ok := data["code"].(string); ok {
			c.storeCodeInRedis(code, wsService)
			c.broadcastCodeUpdate(code, wsService)
		}
	}
}

// storeCodeInRedis stores the user's code in Redis
func (c *Client) storeCodeInRedis(code string, wsService *webSocketService) {
	// Skip storing code if this is a matchmaking session (nil UUID)
	if c.matchID == uuid.Nil {
		wsService.logger.Info().
			Str("userID", c.userID.String()).
			Msg("User in matchmaking - skipping code storage")
		return
	}

	err := wsService.redisManager.UpdateUserCode(c.matchID, c.userID, code)
	if err != nil {
		wsService.logger.Error().Err(err).
			Str("matchID", c.matchID.String()).
			Str("userID", c.userID.String()).
			Msg("Failed to store code in Redis")
	}
}

// broadcastCodeUpdate broadcasts code update to other clients (excluding sender)
func (c *Client) broadcastCodeUpdate(code string, wsService *webSocketService) {
	codeUpdateMsg := CodeUpdateMessage{
		Type:    constants.CodeUpdate,
		MatchID: c.matchID.String(),
		UserID:  c.userID.String(),
		Code:    code,
	}

	msgBytes, _ := json.Marshal(codeUpdateMsg)

	// Broadcast to all clients in the match except the sender
	wsService.hub.mu.RLock()
	matchIDStr := c.matchID.String()
	matchClients, exists := wsService.hub.matchClients[matchIDStr]
	if exists {
		for client := range matchClients {
			// Skip the sender
			if client.userID != c.userID {
				select {
				case client.send <- msgBytes:
					// Message sent successfully
				default:
					// Client's send channel is blocked, skip
				}
			}
		}
	}
	wsService.hub.mu.RUnlock()
}

// writePump writes messages to the client
func (c *Client) writePump() {
	ticker := time.NewTicker(constants.PingIntervalSeconds * time.Second)
	defer func() {
		if r := recover(); r != nil {
			// Log panic but don't crash the service
			// Note: We don't have access to logger here, so we'll just recover
		}
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(constants.WriteDeadlineSeconds * time.Second))
			if !ok {
				// Channel is closed
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// Add all pending messages to current message
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(constants.WriteDeadlineSeconds * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
