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

// WebSocket 관련 상수
const (
	// 메시지 크기 제한
	maxMessageSize = 1024 * 1024 // 1MB

	// 핑/퐁 타임아웃
	pongWait = 60 * time.Second

	// 핑 간격
	pingPeriod = (pongWait * 9) / 10
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

// cleanupUserData WebSocket 연결 해제 시 Redis에서 사용자 데이터 정리
func (s *webSocketService) cleanupUserData(userID uuid.UUID, gameID uuid.UUID) {
	ctx := context.Background()

	// Redis 파이프라인을 사용한 원자적 정리
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

	// 파이프라인 실행
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

// readPump 클라이언트로부터 메시지를 읽는 고루틴
func (c *Client) readPump(wsService *webSocketService) {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
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
				log.Printf("WebSocket read error: %v", err)
			}
			break
		}

		// 메시지 파싱
		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Failed to parse message: %v", err)
			continue
		}

		// 메시지 타입에 따른 처리
		msgType, ok := msg["type"].(string)
		if !ok {
			log.Printf("Invalid message type")
			continue
		}

		switch msgType {
		case "auth":
			// 인증 메시지 처리 (이미 연결 시점에 인증됨)
			log.Printf("Auth message received from user %s", c.userID.String())

		case "ping":
			// ping 메시지에 대한 pong 응답
			pongMsg := map[string]interface{}{
				"type":      "pong",
				"timestamp": time.Now().Unix(),
			}
			pongBytes, _ := json.Marshal(pongMsg)
			c.send <- pongBytes

		case "code_update":
			// 코드 업데이트 메시지 처리
			if data, ok := msg["data"].(map[string]interface{}); ok {
				if code, ok := data["code"].(string); ok {
					// Redis에 코드 저장
					ctx := context.Background()
					codeKey := fmt.Sprintf("game:%s:user:%s:code", c.gameID.String(), c.userID.String())
					wsService.rdb.Set(ctx, codeKey, code, 24*time.Hour)

					// 다른 클라이언트들에게 브로드캐스트
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
			log.Printf("Unknown message type: %s", msgType)
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
