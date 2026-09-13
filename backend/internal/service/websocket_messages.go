package service

// inboundWebSocketMessage is the transport contract accepted from clients.
// Keeping decoding here prevents game handlers from depending on untyped maps.
type inboundWebSocketMessage struct {
	Type       string             `json:"type"`
	Difficulty string             `json:"difficulty,omitempty"`
	Mode       string             `json:"mode,omitempty"`
	Data       *codeUpdatePayload `json:"data,omitempty"`
}

type codeUpdatePayload struct {
	Code     string `json:"code,omitempty"`
	Language string `json:"language,omitempty"`
}

// CodeUpdateMessage is sent when a player's editor snapshot changes.
type CodeUpdateMessage struct {
	Type     string `json:"type"`
	MatchID  string `json:"match_id"`
	UserID   string `json:"user_id"`
	Code     string `json:"code"`
	Language string `json:"language,omitempty"`
}

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
