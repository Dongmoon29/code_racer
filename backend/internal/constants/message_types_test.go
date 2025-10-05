package constants

import "testing"

func TestMessageTypeConstants(t *testing.T) {
	tests := []struct {
		name     string
		msgType  string
		expected bool
	}{
		{"Valid Auth", Auth, true},
		{"Valid Ping", Ping, true},
		{"Valid Pong", Pong, true},
		{"Valid CodeUpdate", CodeUpdate, true},
		{"Valid GameFinished", GameFinished, true},
		{"Valid StartMatching", StartMatching, true},
		{"Valid CancelMatching", CancelMatching, true},
		{"Valid MatchingStatus", MatchingStatus, true},
		{"Valid MatchFound", MatchFound, true},
		{"Valid Error", Error, true},
		{"Invalid message type", "invalid_type", false},
		{"Empty string", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsValidMessageType(tt.msgType)
			if result != tt.expected {
				t.Errorf("IsValidMessageType(%s) = %v, expected %v", tt.msgType, result, tt.expected)
			}
		})
	}
}

func TestGetMessageTypeCategory(t *testing.T) {
	tests := []struct {
		name             string
		msgType          string
		expectedCategory MessageTypeCategory
	}{
		{"Auth category", Auth, CategoryAuth},
		{"Ping category", Ping, CategoryConnection},
		{"Pong category", Pong, CategoryConnection},
		{"CodeUpdate category", CodeUpdate, CategoryGame},
		{"GameFinished category", GameFinished, CategoryGame},
		{"StartMatching category", StartMatching, CategoryMatchmaking},
		{"CancelMatching category", CancelMatching, CategoryMatchmaking},
		{"MatchingStatus category", MatchingStatus, CategoryMatchmaking},
		{"MatchFound category", MatchFound, CategoryMatchmaking},
		{"Error category", Error, CategoryError},
		{"Invalid message type", "invalid", CategoryError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := GetMessageTypeCategory(tt.msgType)
			if result != tt.expectedCategory {
				t.Errorf("GetMessageTypeCategory(%s) = %v, expected %v", tt.msgType, result, tt.expectedCategory)
			}
		})
	}
}

func TestGetAllMessageTypes(t *testing.T) {
	messageTypes := GetAllMessageTypes()

	// Check that we have the expected number of message types
	expectedCount := 10
	if len(messageTypes) != expectedCount {
		t.Errorf("GetAllMessageTypes() returned %d types, expected %d", len(messageTypes), expectedCount)
	}

	// Check that all returned types are valid
	for _, msgType := range messageTypes {
		if !IsValidMessageType(string(msgType)) {
			t.Errorf("GetAllMessageTypes() returned invalid message type: %s", msgType)
		}
	}
}

func TestMessageTypeValues(t *testing.T) {
	// Test that constants have expected values
	expectedValues := map[string]string{
		Auth:           "auth",
		Ping:           "ping",
		Pong:           "pong",
		CodeUpdate:     "code_update",
		GameFinished:   "game_finished",
		StartMatching:  "start_matching",
		CancelMatching: "cancel_matching",
		MatchingStatus: "matching_status",
		MatchFound:     "match_found",
		Error:          "error",
	}

	for constant, expectedValue := range expectedValues {
		if constant != expectedValue {
			t.Errorf("Constant %s = %s, expected %s", constant, constant, expectedValue)
		}
	}
}
