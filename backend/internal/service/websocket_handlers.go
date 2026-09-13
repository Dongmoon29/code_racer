package service

import (
	"context"
	"encoding/json"
	"time"

	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/game"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
)

// handleMessageByType is the typed WebSocket protocol router. It translates
// transport messages and delegates state changes to application ports.
func (c *Client) handleMessageByType(msg inboundWebSocketMessage, wsService *webSocketService) {
	switch msg.Type {
	case constants.Auth:
		return
	case constants.Ping:
		c.handlePingMessage()
	case constants.StartMatching:
		c.handleStartMatchingMessage(msg)
	case constants.CancelMatching:
		c.handleCancelMatchingMessage()
	case constants.CodeUpdate:
		c.handleCodeUpdateMessage(msg, wsService)
	}
}

func (c *Client) handlePingMessage() {
	pongBytes, _ := json.Marshal(map[string]interface{}{"type": constants.Pong, "timestamp": time.Now().Unix()})
	c.send <- pongBytes
}

func (c *Client) handleStartMatchingMessage(msg inboundWebSocketMessage) {
	mode := msg.Mode
	if mode == "" {
		mode = string(model.MatchModeCasualPVP)
	}
	if !model.Difficulty(msg.Difficulty).IsValid() {
		c.hub.sendErrorToClient(c, "Invalid difficulty")
		return
	}
	c.hub.startMatching <- &MatchingRequest{Client: c, Difficulty: msg.Difficulty, Mode: mode}
}

func (c *Client) handleCancelMatchingMessage() {
	c.hub.cancelMatching <- &CancelRequest{Client: c}
}

func (c *Client) handleCodeUpdateMessage(msg inboundWebSocketMessage, wsService *webSocketService) {
	if msg.Data == nil || (msg.Data.Code == "" && msg.Data.Language == "") {
		return
	}
	if c.matchID == uuid.Nil || wsService.engine == nil {
		return
	}
	if err := wsService.engine.UpdateCode(context.Background(), game.CodeSnapshotCommand{
		MatchID: c.matchID, UserID: c.userID, Code: msg.Data.Code, Language: msg.Data.Language,
	}); err != nil {
		wsService.logger.Warn().Err(err).Str("matchID", c.matchID.String()).Str("userID", c.userID.String()).Msg("Failed to persist code snapshot")
		return
	}
	if msg.Data.Code != "" {
		c.broadcastCodeUpdate(msg.Data.Code, msg.Data.Language, wsService)
	}
}

func (c *Client) broadcastCodeUpdate(code, language string, wsService *webSocketService) {
	message, _ := json.Marshal(CodeUpdateMessage{
		Type: constants.CodeUpdate, MatchID: c.matchID.String(), UserID: c.userID.String(), Code: code, Language: language,
	})

	wsService.hub.mu.RLock()
	defer wsService.hub.mu.RUnlock()
	for client := range wsService.hub.matchClients[c.matchID.String()] {
		if client.userID == c.userID {
			continue
		}
		select {
		case client.send <- message:
		default:
		}
	}
}
