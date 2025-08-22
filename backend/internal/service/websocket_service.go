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

	// Ping interval
	pingPeriod = (pongWait * 9) / 10
)

// Hub manages WebSocket connections
type Hub struct {
	// Map of registered clients
	clients map[*Client]bool

	// Map of clients by game ID
	gameClients map[string]map[*Client]bool

	// Channel for client registration
	register chan *Client

	// Channel for client unregistration
	unregister chan *Client

	// Channel for broadcast messages
	broadcast chan *Message

	// Channel for game-specific broadcast messages
	gameBroadcast chan *GameMessage

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

	// Game ID
	gameID uuid.UUID
}

// Message represents a broadcast message
type Message struct {
	// Message content
	data []byte
}

// GameMessage represents a game-specific broadcast message
type GameMessage struct {
	// Game ID
	gameID uuid.UUID

	// Message content
	data []byte
}

// CodeUpdateMessage represents a code update message
type CodeUpdateMessage struct {
	Type   string `json:"type"`
	GameID string `json:"game_id"`
	UserID string `json:"user_id"`
	Code   string `json:"code"`
}

// WebSocketService interface for WebSocket operations
type WebSocketService interface {
	InitHub() *Hub
	HandleConnection(conn *websocket.Conn, userID uuid.UUID, gameID uuid.UUID)
	BroadcastToGame(gameID uuid.UUID, message []byte)
}

// webSocketService implements WebSocketService interface
type webSocketService struct {
	rdb    *redis.Client
	logger logger.Logger
	hub    *Hub
}

// NewWebSocketService creates a new WebSocketService instance
func NewWebSocketService(rdb *redis.Client, logger logger.Logger) WebSocketService {
	return &webSocketService{
		rdb:    rdb,
		logger: logger,
	}
}

// InitHub initializes the WebSocket hub
func (s *webSocketService) InitHub() *Hub {
	s.hub = &Hub{
		clients:       make(map[*Client]bool),
		gameClients:   make(map[string]map[*Client]bool),
		register:      make(chan *Client),
		unregister:    make(chan *Client),
		broadcast:     make(chan *Message),
		gameBroadcast: make(chan *GameMessage),
	}
	return s.hub
}

// Run starts the WebSocket hub
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			// Register client
			h.mu.Lock()
			h.clients[client] = true

			// Add to game-specific client map
			gameID := client.gameID.String()
			if _, ok := h.gameClients[gameID]; !ok {
				h.gameClients[gameID] = make(map[*Client]bool)
			}
			h.gameClients[gameID][client] = true
			h.mu.Unlock()

		case client := <-h.unregister:
			// Unregister client
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)

				// Remove from game-specific client map
				gameID := client.gameID.String()
				if _, ok := h.gameClients[gameID]; ok {
					delete(h.gameClients[gameID], client)
					if len(h.gameClients[gameID]) == 0 {
						delete(h.gameClients, gameID)
					}
				}
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			// Broadcast message to all clients
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message.data:
				default:
					h.mu.RUnlock()
					h.mu.Lock()
					delete(h.clients, client)
					close(client.send)

					// Remove from game-specific client map
					gameID := client.gameID.String()
					if _, ok := h.gameClients[gameID]; ok {
						delete(h.gameClients[gameID], client)
						if len(h.gameClients[gameID]) == 0 {
							delete(h.gameClients, gameID)
						}
					}
					h.mu.Unlock()
					h.mu.RLock()
				}
			}
			h.mu.RUnlock()

		case gameMessage := <-h.gameBroadcast:
			// Broadcast message to specific game clients
			gameID := gameMessage.gameID.String()
			h.mu.RLock()
			if clients, ok := h.gameClients[gameID]; ok {
				for client := range clients {
					select {
					case client.send <- gameMessage.data:
					default:
						h.mu.RUnlock()
						h.mu.Lock()
						delete(h.clients, client)
						close(client.send)

						// Remove from game-specific client map
						if _, ok := h.gameClients[gameID]; ok {
							delete(h.gameClients[gameID], client)
							if len(h.gameClients[gameID]) == 0 {
								delete(h.gameClients, gameID)
							}
						}
						h.mu.Unlock()
						h.mu.RLock()
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

// HandleConnection handles a new WebSocket connection
func (s *webSocketService) HandleConnection(conn *websocket.Conn, userID uuid.UUID, gameID uuid.UUID) {
	// Create client
	client := &Client{
		hub:    s.hub,
		conn:   conn,
		send:   make(chan []byte, 256),
		userID: userID,
		gameID: gameID,
	}

	// Register client with hub
	client.hub.register <- client

	// Load existing code and send to client
	ctx := context.Background()
	codeKey := fmt.Sprintf("game:%s:user:%s:code", gameID.String(), userID.String())
	if existingCode, err := s.rdb.Get(ctx, codeKey).Result(); err == nil && existingCode != "" {
		// Send existing code to client
		codeUpdateMsg := CodeUpdateMessage{
			Type:   "code_update",
			GameID: gameID.String(),
			UserID: userID.String(),
			Code:   existingCode,
		}
		msgBytes, _ := json.Marshal(codeUpdateMsg)
		client.send <- msgBytes
	}

	// Add user to game participants list
	gameUsersKey := fmt.Sprintf("game:%s:users", gameID.String())
	s.rdb.SAdd(ctx, gameUsersKey, userID.String())
	s.rdb.Expire(ctx, gameUsersKey, 24*time.Hour)

	// Start goroutines for client message reading and writing
	go client.readPump(s)
	go client.writePump()
}

// BroadcastToGame broadcasts a message to all clients in a specific game
func (s *webSocketService) BroadcastToGame(gameID uuid.UUID, message []byte) {
	s.hub.gameBroadcast <- &GameMessage{
		gameID: gameID,
		data:   message,
	}
}

// getGameUsers gets the list of user IDs participating in a game
func (s *webSocketService) getGameUsers(ctx context.Context, gameID uuid.UUID) ([]string, error) {
	gameKey := fmt.Sprintf("game:%s:users", gameID.String())
	return s.rdb.SMembers(ctx, gameKey).Result()
}

// cleanupUserData cleans up user data from Redis when WebSocket connection is closed
func (s *webSocketService) cleanupUserData(userID uuid.UUID, gameID uuid.UUID) {
	ctx := context.Background()

	// Use Redis pipeline for atomic cleanup
	pipe := s.rdb.Pipeline()

	// 게임 참가자 목록에서 사용자 제거
	gameUsersKey := fmt.Sprintf("game:%s:users", gameID.String())
	pipe.SRem(ctx, gameUsersKey, userID.String())

	// 사용자 코드 데이터 삭제 (선택적 - 게임이 진행 중이면 보존할 수도 있음)
	codeKey := fmt.Sprintf("game:%s:user:%s:code", gameID.String(), userID.String())

	// 게임 상태 확인을 위해 게임 정보 조회
	gameKey := fmt.Sprintf("game:%s", gameID.String())
	gameStatus, err := s.rdb.HGet(ctx, gameKey, "status").Result()
	if err != nil {
		s.logger.Error().Err(err).Msg("Failed to get game status during cleanup")
	}

	// 게임이 대기 중이거나 종료된 경우에만 코드 데이터 삭제
	if gameStatus == string(model.GameStatusWaiting) ||
		gameStatus == string(model.GameStatusFinished) ||
		gameStatus == string(model.GameStatusClosed) {
		pipe.Del(ctx, codeKey)
	}

	// 게임 참가자가 모두 나간 경우 게임 관련 데이터 정리
	remainingUsers, err := s.rdb.SCard(ctx, gameUsersKey).Result()
	if err == nil && remainingUsers <= 1 { // 현재 사용자 제거 후 0명 또는 1명 남음
		// 대기 중인 게임이라면 완전 정리
		if gameStatus == string(model.GameStatusWaiting) {
			pipe.Del(ctx, gameKey)
			pipe.Del(ctx, gameUsersKey)
			// 모든 사용자 코드 삭제
			users, _ := s.rdb.SMembers(ctx, gameUsersKey).Result()
			for _, uid := range users {
				userCodeKey := fmt.Sprintf("game:%s:user:%s:code", gameID.String(), uid)
				pipe.Del(ctx, userCodeKey)
			}
		}
	}

	// Execute pipeline
	if _, err := pipe.Exec(ctx); err != nil {
		s.logger.Error().
			Err(err).
			Str("userID", userID.String()).
			Str("gameID", gameID.String()).
			Msg("Failed to cleanup user data in Redis")
	} else {
		s.logger.Debug().
			Str("userID", userID.String()).
			Str("gameID", gameID.String()).
			Msg("Successfully cleaned up user data in Redis")
	}
}

// readPump reads messages from the client
func (c *Client) readPump(wsService *webSocketService) {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
		// Clean up user data when connection is closed
		wsService.cleanupUserData(c.userID, c.gameID)
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
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				// unexpected close error
				continue
			} else {
				break
			}
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

		case "code_update":
			// Handle code update message
			if data, ok := msg["data"].(map[string]interface{}); ok {
				if code, ok := data["code"].(string); ok {
					// Store code in Redis
					ctx := context.Background()
					codeKey := fmt.Sprintf("game:%s:user:%s:code", c.gameID.String(), c.userID.String())
					wsService.rdb.Set(ctx, codeKey, code, 24*time.Hour)

					// Broadcast to other clients
					codeUpdateMsg := CodeUpdateMessage{
						Type:   "code_update",
						GameID: c.gameID.String(),
						UserID: c.userID.String(),
						Code:   code,
					}

					msgBytes, _ := json.Marshal(codeUpdateMsg)
					wsService.BroadcastToGame(c.gameID, msgBytes)
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
