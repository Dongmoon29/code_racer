package service

import (
	"io"
	"testing"

	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
)

func TestHubSendToMatchUser_DoesNotLeakToOpponent(t *testing.T) {
	log := zerolog.New(io.Discard)
	matchID := uuid.New()
	targetID := uuid.New()
	opponentID := uuid.New()
	target := &Client{userID: targetID, matchID: matchID, send: make(chan []byte, 1)}
	opponent := &Client{userID: opponentID, matchID: matchID, send: make(chan []byte, 1)}
	hub := &Hub{
		matchClients: map[string]map[*Client]bool{
			matchID.String(): {target: true, opponent: true},
		},
		logger: &log,
	}

	hub.sendToMatchUser(matchID, targetID, []byte("private result"))
	assert.Equal(t, []byte("private result"), <-target.send)
	select {
	case leaked := <-opponent.send:
		t.Fatalf("private message leaked to opponent: %s", leaked)
	default:
	}
}
