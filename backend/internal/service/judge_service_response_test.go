package service

import (
	"io"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/types"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
)

func responseTestJudgeService() *judgeService {
	log := zerolog.New(io.Discard)
	return &judgeService{logger: &log}
}

func TestBatchResponseError_UsesJudgeStatus(t *testing.T) {
	tests := []struct {
		name      string
		response  *types.Judge0Response
		errorType types.ErrorType
	}{
		{
			name: "compile error",
			response: &types.Judge0Response{
				Status:        types.JudgeStatus{ID: 6, Description: "Compilation Error"},
				CompileOutput: "syntax error",
			},
			errorType: types.ErrorTypeCompilation,
		},
		{
			name: "timeout",
			response: &types.Judge0Response{
				Status: types.JudgeStatus{ID: 5, Description: "Time Limit Exceeded"},
			},
			errorType: types.ErrorTypeTimeout,
		},
		{
			name: "runtime error",
			response: &types.Judge0Response{
				Status: types.JudgeStatus{ID: 11, Description: "Runtime Error"},
				Stderr: "panic",
			},
			errorType: types.ErrorTypeRuntime,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			errorType, message := batchResponseError(test.response)
			assert.Equal(t, test.errorType, errorType)
			assert.NotEmpty(t, message)
		})
	}
}

func TestCompareResults_ComparesJSONSemantically(t *testing.T) {
	service := responseTestJudgeService()
	assert.True(t, service.compareResults(`{ "b": [2, 3], "a": 1.0 }`, `{"a":1,"b":[2,3]}`))
}
