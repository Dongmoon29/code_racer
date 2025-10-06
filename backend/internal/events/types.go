package events

import (
	"github.com/Dongmoon29/code_racer/internal/model"
)

// MatchCreatedEvent is published after a match is successfully created
type MatchCreatedEvent struct {
	Match *model.Match
}
