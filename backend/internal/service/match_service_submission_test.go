package service

import (
	"strings"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/apperr"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestValidateSubmissionRequest(t *testing.T) {
	playerA := uuid.New()
	playerB := uuid.New()
	match := &model.Match{PlayerAID: playerA, PlayerBID: &playerB}

	require.NoError(t, validateSubmissionRequest(match, playerA, "def solution(): pass", "python"))
	require.NoError(t, validateSubmissionRequest(match, playerB, "func solution() {}", "go"))

	tests := []struct {
		name     string
		user     uuid.UUID
		code     string
		lang     string
		expected apperr.Code
	}{
		{"non participant", uuid.New(), "x", "go", apperr.CodeForbidden},
		{"unsupported language", playerA, "x", "rust", apperr.CodeBadRequest},
		{"oversized code", playerA, strings.Repeat("x", maxSubmissionCodeBytes+1), "python", apperr.CodeBadRequest},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := validateSubmissionRequest(match, test.user, test.code, test.lang)
			appErr, ok := apperr.As(err)
			require.True(t, ok)
			assert.Equal(t, test.expected, appErr.Code)
		})
	}
}

func TestNewGameEngineRejectsMissingDependencies(t *testing.T) {
	engine, err := NewGameEngine(GameEngineDependencies{})

	require.Nil(t, engine)
	require.ErrorContains(t, err, "game engine requires")
}
