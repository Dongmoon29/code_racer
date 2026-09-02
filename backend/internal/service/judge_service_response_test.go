package service

import (
	"io"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/types"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
)

func responseTestJudgeService() *judgeService {
	log := zerolog.New(io.Discard)
	return &judgeService{logger: &log}
}

func TestEvaluateSingleResponse_UsesJudgeStatus(t *testing.T) {
	service := responseTestJudgeService()
	testCase := model.TestCase{Input: "1", ExpectedOutput: "true"}

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
			result := service.evaluateSingleResponse(test.response, testCase, testCase.ExpectedOutput, 0)
			assert.False(t, result.Passed)
			assert.Equal(t, test.errorType, result.ErrorType)
			assert.NotEmpty(t, result.ErrorMessage)
		})
	}
}

func TestEvaluateSingleResponse_ComparesJSONSemantically(t *testing.T) {
	service := responseTestJudgeService()
	testCase := model.TestCase{Input: "[]", ExpectedOutput: `{"a":1,"b":[2,3]}`}
	response := &types.Judge0Response{
		Status: types.JudgeStatus{ID: 3, Description: "Accepted"},
		Stdout: `{ "b": [2, 3], "a": 1.0 }`,
	}

	result := service.evaluateSingleResponse(response, testCase, testCase.ExpectedOutput, 0)
	assert.True(t, result.Passed)
}
