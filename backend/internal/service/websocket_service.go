package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// Hub 웹소켓 허브 구조체
type Hub struct {
	// 등록된 클라이언트 맵
	clients map[*Client]bool

	// 게임 ID별 클라이언트 맵
	gameClients map[string]map[*Client]bool

	// 클라이언트 등록 채널
	register chan *Client

	// 클라이언트 등록 해제 채널
	unregister chan *Client

	// 브로드캐스트 메시지 채널
	broadcast chan *Message

	// 게임별 브로드캐스트 메시지 채널
	gameBroadcast chan *GameMessage

	// 뮤텍스 락
	mu sync.RWMutex
}

// Client 웹소켓 클라이언트 구조체
type Client struct {
	// 허브 참조
	hub *Hub

	// 웹소켓 연결
	conn *websocket.Conn

	// 메시지 전송 채널
	send chan []byte

	// 사용자 ID
	userID uuid.UUID

	// 게임 ID
	gameID uuid.UUID
}

// Message 브로드캐스트 메시지 구조체
type Message struct {
	// 메시지 내용
	data []byte
}

// GameMessage 게임별 브로드캐스트 메시지 구조체
type GameMessage struct {
	// 게임 ID
	gameID uuid.UUID

	// 메시지 내용
	data []byte
}

// CodeUpdateMessage 코드 업데이트 메시지 구조체
type CodeUpdateMessage struct {
	Type   string `json:"type"`
	GameID string `json:"game_id"`
	UserID string `json:"user_id"`
	Code   string `json:"code"`
}

// WebSocketService 웹소켓 관련 서비스 인터페이스
type WebSocketService interface {
	InitHub() *Hub
	HandleConnection(conn *websocket.Conn, userID uuid.UUID, gameID uuid.UUID)
	BroadcastToGame(gameID uuid.UUID, message []byte)
}

// webSocketService WebSocketService 인터페이스 구현체
type webSocketService struct {
	rdb    *redis.Client
	hub    *Hub
	logger logger.Logger
}

// NewWebSocketService WebSocketService 인스턴스 생성
func NewWebSocketService(rdb *redis.Client, logger logger.Logger) WebSocketService {
	return &webSocketService{
		rdb:    rdb,
		logger: logger,
	}
}

// InitHub 웹소켓 허브 초기화
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

// Run 웹소켓 허브 실행
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			// 클라이언트 등록
			h.mu.Lock()
			h.clients[client] = true

			// 게임별 클라이언트 맵에 추가
			gameID := client.gameID.String()
			if _, ok := h.gameClients[gameID]; !ok {
				h.gameClients[gameID] = make(map[*Client]bool)
			}
			h.gameClients[gameID][client] = true
			h.mu.Unlock()

		case client := <-h.unregister:
			// 클라이언트 등록 해제
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)

				// 게임별 클라이언트 맵에서 제거
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
			// 전체 클라이언트에 메시지 브로드캐스트
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client.send <- message.data:
				default:
					h.mu.RUnlock()
					h.mu.Lock()
					delete(h.clients, client)
					close(client.send)

					// 게임별 클라이언트 맵에서 제거
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

		case message := <-h.gameBroadcast:
			// 특정 게임의 클라이언트에만 메시지 브로드캐스트
			gameID := message.gameID.String()
			h.mu.RLock()
			if clients, ok := h.gameClients[gameID]; ok {
				for client := range clients {
					select {
					case client.send <- message.data:
					default:
						h.mu.RUnlock()
						h.mu.Lock()
						delete(h.clients, client)
						close(client.send)

						// 게임별 클라이언트 맵에서 제거
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

// HandleConnection 웹소켓 연결 처리
func (s *webSocketService) HandleConnection(conn *websocket.Conn, userID uuid.UUID, gameID uuid.UUID) {
	// 클라이언트 생성
	client := &Client{
		hub:    s.hub,
		conn:   conn,
		send:   make(chan []byte, 256),
		userID: userID,
		gameID: gameID,
	}

	// 허브에 클라이언트 등록
	client.hub.register <- client

	// 기존 코드 로드 및 전송
	ctx := context.Background()
	gameUsers, err := s.getGameUsers(ctx, gameID)
	if err == nil {
		for _, uid := range gameUsers {
			codeKey := fmt.Sprintf("game:%s:user:%s:code", gameID.String(), uid)
			code, err := s.rdb.Get(ctx, codeKey).Result()
			if err == nil {
				// 코드 업데이트 메시지 생성
				codeUpdateMsg := CodeUpdateMessage{
					Type:   "code_update",
					GameID: gameID.String(),
					UserID: uid,
					Code:   code,
				}

				msgBytes, _ := json.Marshal(codeUpdateMsg)
				client.send <- msgBytes
			}
		}
	}

	// 사용자를 게임 참가자 목록에 추가
	gameUsersKey := fmt.Sprintf("game:%s:users", gameID.String())
	s.rdb.SAdd(ctx, gameUsersKey, userID.String())
	s.rdb.Expire(ctx, gameUsersKey, 24*time.Hour)

	// 고루틴으로 클라이언트 메시지 읽기 및 쓰기 처리
	go client.writePump()
	go client.readPump(s)
}

// BroadcastToGame 특정 게임에 메시지 브로드캐스트
func (s *webSocketService) BroadcastToGame(gameID uuid.UUID, message []byte) {
	s.hub.gameBroadcast <- &GameMessage{
		gameID: gameID,
		data:   message,
	}
}

// getGameUsers 게임에 참가 중인 사용자 ID 목록 가져오기
func (s *webSocketService) getGameUsers(ctx context.Context, gameID uuid.UUID) ([]string, error) {
	gameKey := fmt.Sprintf("game:%s:users", gameID.String())
	return s.rdb.SMembers(ctx, gameKey).Result()
}

// readPump 클라이언트에서 메시지 읽기
func (c *Client) readPump(s *webSocketService) {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(1024 * 1024) // 1MB
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		// 메시지 처리
		var msgMap map[string]interface{}
		if err := json.Unmarshal(message, &msgMap); err != nil {
			log.Printf("error unmarshaling message: %v", err)
			continue
		}

		// 메시지 타입에 따른 처리
		msgType, ok := msgMap["type"].(string)
		if !ok {
			continue
		}

		switch msgType {
		case model.MessageTypeCodeUpdate:
			// 코드 업데이트 메시지 처리
			code, ok := msgMap["code"].(string)
			if !ok {
				continue
			}

			// Redis에 코드 저장
			ctx := context.Background()
			codeKey := fmt.Sprintf("game:%s:user:%s:code", c.gameID.String(), c.userID.String())
			if err := s.rdb.Set(ctx, codeKey, code, 24*time.Hour).Err(); err != nil {
				log.Printf("error saving code to Redis: %v", err)
				continue
			}

			// 업데이트된 코드 브로드캐스트
			codeUpdateMsg := CodeUpdateMessage{
				Type:   model.MessageTypeCodeUpdate,
				GameID: c.gameID.String(),
				UserID: c.userID.String(),
				Code:   code,
			}

			msgBytes, _ := json.Marshal(codeUpdateMsg)
			c.hub.gameBroadcast <- &GameMessage{
				gameID: c.gameID,
				data:   msgBytes,
			}
		}
	}
}

// writePump 클라이언트에 메시지 쓰기
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
				// 채널이 닫힌 경우
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			// 대기 중인 모든 메시지를 현재 메시지에 추가
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			// 핑 메시지 전송
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
