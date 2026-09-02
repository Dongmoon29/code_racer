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

	require.NoError(t, validateSubmissionRequest(match, playerA, &model.SubmitSolutionRequest{
		Code: "def solution(): pass", Language: "python",
	}))
	require.NoError(t, validateSubmissionRequest(match, playerB, &model.SubmitSolutionRequest{
		Code: "func solution() {}", Language: "go",
	}))

	tests := []struct {
		name string
		user uuid.UUID
		req  *model.SubmitSolutionRequest
		code apperr.Code
	}{
		{"non participant", uuid.New(), &model.SubmitSolutionRequest{Code: "x", Language: "go"}, apperr.CodeForbidden},
		{"unsupported language", playerA, &model.SubmitSolutionRequest{Code: "x", Language: "rust"}, apperr.CodeBadRequest},
		{"oversized code", playerA, &model.SubmitSolutionRequest{Code: strings.Repeat("x", maxSubmissionCodeBytes+1), Language: "python"}, apperr.CodeBadRequest},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := validateSubmissionRequest(match, test.user, test.req)
			appErr, ok := apperr.As(err)
			require.True(t, ok)
			assert.Equal(t, test.code, appErr.Code)
		})
	}
}
