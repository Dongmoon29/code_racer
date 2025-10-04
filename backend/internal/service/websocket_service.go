package service

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// WebSocket constants
const (
	// Message size limit
	maxMessageSize = 1024 * 1024 // 1MB

	// Ping/pong timeout
	pongWait = 60 * time.Second
)

// Hub manages WebSocket connections
type Hub struct {
	// Map of registered clients
	clients map[*Client]bool

	// Map of clients by match ID
	matchClients map[string]map[*Client]bool

	// NEW: Matchmaking clients by difficulty
	matchingClients map[string][]*Client

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

	// Mutex lock
	mu sync.RWMutex
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

// GameServiceInterface for game creation during matching
// Deprecated: GameServiceInterface replaced by MatchmakingService/MatchService

// WebSocketService interface for WebSocket operations
type WebSocketService interface {
	InitHub() *Hub
	HandleConnection(conn *websocket.Conn, userID uuid.UUID, matchID uuid.UUID)
	BroadcastToMatch(matchID uuid.UUID, message []byte)
}

// webSocketService implements WebSocketService interface
type webSocketService struct {
	rdb                *redis.Client
	logger             logger.Logger
	hub                *Hub
	matchmakingService MatchmakingService
}

// NewWebSocketService creates a new WebSocketService instance
func NewWebSocketService(rdb *redis.Client, logger logger.Logger, matchmakingService MatchmakingService) WebSocketService {
	service := &webSocketService{
		rdb:                rdb,
		logger:             logger,
		matchmakingService: matchmakingService,
	}
	service.InitHub()
	return service
}

// InitHub initializes the WebSocket hub
func (s *webSocketService) InitHub() *Hub {
	s.hub = &Hub{
		clients:            make(map[*Client]bool),
		matchClients:       make(map[string]map[*Client]bool),
		matchingClients:    make(map[string][]*Client),
		register:           make(chan *Client),
		unregister:         make(chan *Client),
		broadcast:          make(chan *Message),
		matchBroadcast:     make(chan *MatchMessage),
		startMatching:      make(chan *MatchingRequest),
		cancelMatching:     make(chan *CancelRequest),
		matchmakingService: s.matchmakingService,
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
	if _, exists := h.clients[client]; !exists {
		return
	}

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
	fmt.Printf("🔍 handleStartMatching called for user: %s, difficulty: %s\n", req.Client.userID.String(), req.Difficulty)

	h.mu.Lock()
	defer h.mu.Unlock()

	client := req.Client
	difficulty := req.Difficulty

	// Update client matching state
	client.isMatching = true
	client.difficulty = difficulty
	client.matchStarted = time.Now()

	// Prevent duplicate queue entries by removing any existing occurrence first
	h.removeFromMatchingQueue(client)

	// Add to matching queue
	h.matchingClients[difficulty] = append(h.matchingClients[difficulty], client)
	fmt.Printf("🔍 Added to queue. Current queue size for %s: %d\n", difficulty, len(h.matchingClients[difficulty]))

	// Send queue status to client
	queuePos := len(h.matchingClients[difficulty])
	h.sendMatchingStatus(client, "searching", queuePos, 0)
	fmt.Printf("🔍 Sent matching status to client\n")

	// Try to find a match immediately
	h.tryMatchmaking(difficulty)
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

	// Send cancellation confirmation
	h.sendMatchingStatus(client, "canceled", 0, 0)
}

// removeFromMatchingQueue removes a client from all matching queues
func (h *Hub) removeFromMatchingQueue(client *Client) {
	for difficulty, clients := range h.matchingClients {
		for i, c := range clients {
			if c == client {
				// Remove client from slice
				h.matchingClients[difficulty] = append(clients[:i], clients[i+1:]...)
				break
			}
		}
		// Clean up empty queues
		if len(h.matchingClients[difficulty]) == 0 {
			delete(h.matchingClients, difficulty)
		}
	}
}

// tryMatchmaking attempts to match waiting clients
func (h *Hub) tryMatchmaking(difficulty string) {
	clients := h.matchingClients[difficulty]

	// Need at least 2 clients to match
	if len(clients) < 2 {
		return
	}

	// Match first two clients (FIFO)
	player1 := clients[0]
	player2 := clients[1]

	// Remove matched clients from queue
	h.matchingClients[difficulty] = clients[2:]
	if len(h.matchingClients[difficulty]) == 0 {
		delete(h.matchingClients, difficulty)
	}

	// Create game and notify clients
	go h.createMatchedGame(player1, player2, difficulty)
}

// sendMatchingStatus sends matching status to a client
func (h *Hub) sendMatchingStatus(client *Client, status string, queuePos, waitTime int) {
	msg := MatchingStatusMessage{
		Type:     "matching_status",
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
	game, err := h.matchmakingService.CreateMatch(player1.userID, player2.userID, difficulty)
	if err != nil {
		// Reset flags on error
		player1.disconnectAfterMatch = false
		player2.disconnectAfterMatch = false
		
		// Send error to both players
		errorMsg := map[string]interface{}{
			"type":    "match_error",
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

		// Return players to matching queue on error
		h.mu.Lock()
		h.matchingClients[difficulty] = append([]*Client{player1, player2}, h.matchingClients[difficulty]...)
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
			"type":    "match_found",
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

	// Create detailed match found messages
	matchMsg1 := MatchFoundMessage{
		Type:   "match_found",
		GameID: actualMatch.ID.String(),
		Problem: map[string]interface{}{
			"id":          actualMatch.LeetCode.ID.String(),
			"title":       actualMatch.LeetCode.Title,
			"difficulty":  actualMatch.LeetCode.Difficulty,
			"description": actualMatch.LeetCode.Description,
		},
		Opponent: map[string]interface{}{
			"id":   player2.userID.String(),
			"name": "Player 2", // TODO: Get actual user name
		},
	}

	matchMsg2 := MatchFoundMessage{
		Type:   "match_found",
		GameID: actualMatch.ID.String(),
		Problem: map[string]interface{}{
			"id":          actualMatch.LeetCode.ID.String(),
			"title":       actualMatch.LeetCode.Title,
			"difficulty":  actualMatch.LeetCode.Difficulty,
			"description": actualMatch.LeetCode.Description,
		},
		Opponent: map[string]interface{}{
			"id":   player1.userID.String(),
			"name": "Player 1", // TODO: Get actual user name
		},
	}

	// Send to both players
	if msgBytes1, err := json.Marshal(matchMsg1); err == nil {
		select {
		case player1.send <- msgBytes1:
			// Log successful message send
			fmt.Printf("✅ Match found message sent to player1: %s\n", string(msgBytes1))
		default:
			fmt.Printf("❌ Failed to send match found message to player1 (channel blocked)\n")
		}
	} else {
		fmt.Printf("❌ Failed to marshal match message for player1: %v\n", err)
	}

	if msgBytes2, err := json.Marshal(matchMsg2); err == nil {
		select {
		case player2.send <- msgBytes2:
			fmt.Printf("✅ Match found message sent to player2: %s\n", string(msgBytes2))
		default:
			fmt.Printf("❌ Failed to send match found message to player2 (channel blocked)\n")
		}
	} else {
		fmt.Printf("❌ Failed to marshal match message for player2: %v\n", err)
	}

	// Do not mutate matchmaking connections into game connections here.
	// Clients should open a dedicated game WebSocket using /ws/:matchId after receiving match_found.
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

// Run starts the WebSocket hub
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
		}
	}
}

// HandleConnection handles a new WebSocket connection
func (s *webSocketService) HandleConnection(conn *websocket.Conn, userID uuid.UUID, matchID uuid.UUID) {
	// Create client
	client := &Client{
		hub:     s.hub,
		conn:    conn,
		send:    make(chan []byte, 256),
		userID:  userID,
		matchID: matchID,
	}

	// Register client with hub
	client.hub.register <- client

	// Load existing code and send to client
	ctx := context.Background()
	codeKey := fmt.Sprintf("match:%s:user:%s:code", matchID.String(), userID.String())
	if existingCode, err := s.rdb.Get(ctx, codeKey).Result(); err == nil && existingCode != "" {
		// Send existing code to client
		codeUpdateMsg := CodeUpdateMessage{Type: "code_update", MatchID: matchID.String(), UserID: userID.String(), Code: existingCode}
		msgBytes, _ := json.Marshal(codeUpdateMsg)
		client.send <- msgBytes
	}

	// Add user to game participants list
	matchUsersKey := fmt.Sprintf("match:%s:users", matchID.String())
	s.rdb.SAdd(ctx, matchUsersKey, userID.String())
	s.rdb.Expire(ctx, matchUsersKey, 24*time.Hour)

	// Start goroutines for client message reading and writing
	go client.readPump(s)
	go client.writePump()
}

// BroadcastToGame broadcasts a message to all clients in a specific game
func (s *webSocketService) BroadcastToMatch(matchID uuid.UUID, message []byte) {
	s.hub.matchBroadcast <- &MatchMessage{matchID: matchID, data: message}
}

// cleanupUserData cleans up user data from Redis when WebSocket connection is closed
func (s *webSocketService) cleanupUserData(userID uuid.UUID, matchID uuid.UUID) {
	// Ignore cleanup for matchmaking pseudo-room
	if matchID == uuid.Nil {
		return
	}
	ctx := context.Background()

	// Use Redis pipeline for atomic cleanup
	pipe := s.rdb.Pipeline()

	// 게임 참가자 목록에서 사용자 제거
	matchUsersKey := fmt.Sprintf("match:%s:users", matchID.String())
	pipe.SRem(ctx, matchUsersKey, userID.String())

	// 사용자 코드 데이터 삭제 (선택적 - 게임이 진행 중이면 보존할 수도 있음)
	codeKey := fmt.Sprintf("match:%s:user:%s:code", matchID.String(), userID.String())

	// 게임 상태 확인을 위해 게임 정보 조회
	matchKey := fmt.Sprintf("match:%s", matchID.String())
	matchStatus, err := s.rdb.HGet(ctx, matchKey, "status").Result()
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to get match status during cleanup")
	}

	// 게임이 대기 중이거나 종료된 경우에만 코드 데이터 삭제
	if matchStatus == string(model.MatchStatusWaiting) ||
		matchStatus == string(model.MatchStatusFinished) ||
		matchStatus == string(model.MatchStatusClosed) {
		pipe.Del(ctx, codeKey)
	}

	// 게임 참가자가 모두 나간 경우 게임 관련 데이터 정리
	remainingUsers, err := s.rdb.SCard(ctx, matchUsersKey).Result()
	if err == nil && remainingUsers <= 1 { // 현재 사용자 제거 후 0명 또는 1명 남음
		// 대기 중인 게임이라면 완전 정리
		if matchStatus == string(model.MatchStatusWaiting) {
			pipe.Del(ctx, matchKey)
			pipe.Del(ctx, matchUsersKey)
			// 모든 사용자 코드 삭제
			users, _ := s.rdb.SMembers(ctx, matchUsersKey).Result()
			for _, uid := range users {
				userCodeKey := fmt.Sprintf("match:%s:user:%s:code", matchID.String(), uid)
				pipe.Del(ctx, userCodeKey)
			}
		}
	}

	// Execute pipeline
	if _, err := pipe.Exec(ctx); err != nil {
		s.logger.Error().Err(err).Str("userID", userID.String()).Str("matchID", matchID.String()).Msg("Failed to cleanup user data in Redis")
	} else {
		s.logger.Debug().Str("userID", userID.String()).Str("matchID", matchID.String()).Msg("Successfully cleaned up user data in Redis")
	}
}

// readPump reads messages from the client
func (c *Client) readPump(wsService *webSocketService) {
	defer func() {
		if r := recover(); r != nil {
			wsService.logger.Error().Interface("panic", r).Msg("Recovered from panic in readPump")
		}
		c.hub.unregister <- c
		c.conn.Close()
		// Clean up user data when connection is closed
		wsService.cleanupUserData(c.userID, c.matchID)
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			// On any read error, log and close gracefully to avoid repeated reads on failed connection
			wsService.logger.Debug().Err(err).Msg("WebSocket read error, closing connection")
			break
		}

		// Parse message
		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err != nil {
			// Don't log message parsing failures (client errors)
			continue
		}

		// Handle message by type
		msgType, ok := msg["type"].(string)
		if !ok {
			// Don't log invalid message types
			continue
		}

		switch msgType {
		case "auth":
			// Handle auth message (already authenticated at connection time)
			// Logging removed

		case "ping":
			// Respond to ping message with pong
			pongMsg := map[string]interface{}{
				"type":      "pong",
				"timestamp": time.Now().Unix(),
			}
			pongBytes, _ := json.Marshal(pongMsg)
			c.send <- pongBytes

		case "start_matching":
			// Handle start matching request
			fmt.Printf("🎯 Received start_matching message: %+v\n", msg)
			// Frontend sends difficulty directly in the message, not nested in data
			if difficulty, ok := msg["difficulty"].(string); ok {
				fmt.Printf("🎯 Extracted difficulty: %s\n", difficulty)
				// Validate difficulty
				if difficulty == "Easy" || difficulty == "Medium" || difficulty == "Hard" {
					fmt.Printf("🎯 Creating match request for user: %s\n", c.userID.String())
					matchReq := &MatchingRequest{
						Client:     c,
						Difficulty: difficulty,
					}
					c.hub.startMatching <- matchReq
					fmt.Printf("🎯 Match request sent to hub\n")
				} else {
					fmt.Printf("❌ Invalid difficulty: %s\n", difficulty)
				}
			} else {
				fmt.Printf("❌ Failed to extract difficulty from message: %+v\n", msg)
			}

		case "cancel_matching":
			// Handle cancel matching request
			cancelReq := &CancelRequest{
				Client: c,
			}
			c.hub.cancelMatching <- cancelReq

		case "code_update":
			// Handle code update message
			if data, ok := msg["data"].(map[string]interface{}); ok {
				if code, ok := data["code"].(string); ok {
					// Store code in Redis
					ctx := context.Background()
					codeKey := fmt.Sprintf("match:%s:user:%s:code", c.matchID.String(), c.userID.String())
					wsService.rdb.Set(ctx, codeKey, code, 24*time.Hour)

					// Broadcast to other clients
					codeUpdateMsg := CodeUpdateMessage{Type: "code_update", MatchID: c.matchID.String(), UserID: c.userID.String(), Code: code}

					msgBytes, _ := json.Marshal(codeUpdateMsg)
					wsService.BroadcastToMatch(c.matchID, msgBytes)
				}
			}

		default:
			// Don't log unknown message types
		}
	}
}

// writePump writes messages to the client
func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
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
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
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
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
