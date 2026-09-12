package service

import (
	"context"
	"io"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/types"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type batchTestWrapper struct {
	stdin string
}

func (w *batchTestWrapper) WrapCode(string, int, string, *model.Problem) (string, error) {
	return "", nil
}

func (w *batchTestWrapper) WrapCodeBatch(_ string, _ int, stdin string, _ *model.Problem) (string, error) {
	w.stdin = stdin
	return "wrapped batch", nil
}

type batchTestClient struct {
	requests []types.Judge0Request
	response *types.Judge0Response
}

func (c *batchTestClient) SubmitCode(_ context.Context, request types.Judge0Request) (*types.Judge0Response, error) {
	c.requests = append(c.requests, request)
	return c.response, nil
}
func (c *batchTestClient) Close()                  {}
func (c *batchTestClient) GetRateLimitStatus() int { return 0 }

func TestAggregateBatch_SubmitsOnceAndMapsResults(t *testing.T) {
	log := zerolog.New(io.Discard)
	wrapper := &batchTestWrapper{}
	client := &batchTestClient{response: &types.Judge0Response{
		Stdout: `[3,false]`,
		Time:   "0.02",
		Memory: 1024,
		Status: types.JudgeStatus{ID: 3, Description: "Accepted"},
	}}
	service := &judgeService{codeWrapper: wrapper, judge0Client: client, logger: &log}
	problem := &model.Problem{
		FunctionName: "solve",
		TimeLimit:    2000,
		MemoryLimit:  128,
		TestCases: []model.TestCase{
			{Input: `[1,2]`, ExpectedOutput: `3`},
			{Input: `[3,4]`, ExpectedOutput: `true`},
		},
	}

	result, err := service.aggregateBatch("code", 63, problem)
	require.NoError(t, err)
	require.Len(t, client.requests, 1)
	assert.Equal(t, 4, client.requests[0].RunTimeout)
	assert.JSONEq(t, `[[1,2],[3,4]]`, wrapper.stdin)
	require.Len(t, result.TestResults, 2)
	assert.True(t, result.TestResults[0].Passed)
	assert.False(t, result.TestResults[1].Passed)
	assert.False(t, result.Passed)
	assert.Equal(t, 0.01, result.ExecutionTime)
}

func TestAggregateBatch_RejectsProblemWithoutTestCases(t *testing.T) {
	log := zerolog.New(io.Discard)
	client := &batchTestClient{}
	service := &judgeService{codeWrapper: &batchTestWrapper{}, judge0Client: client, logger: &log}

	result, err := service.aggregateBatch("code", 63, &model.Problem{})

	require.Error(t, err)
	assert.Nil(t, result)
	assert.Empty(t, client.requests)
}

func TestAggregateBatch_RejectsWrongResultCount(t *testing.T) {
	log := zerolog.New(io.Discard)
	client := &batchTestClient{response: &types.Judge0Response{
		Stdout: `[3]`,
		Status: types.JudgeStatus{ID: 3, Description: "Accepted"},
	}}
	service := &judgeService{codeWrapper: &batchTestWrapper{}, judge0Client: client, logger: &log}
	problem := &model.Problem{
		FunctionName: "solve",
		TimeLimit:    2000,
		MemoryLimit:  128,
		TestCases: []model.TestCase{
			{Input: `[1]`, ExpectedOutput: `1`},
			{Input: `[2]`, ExpectedOutput: `2`},
		},
	}

	result, err := service.aggregateBatch("code", 63, problem)
	require.NoError(t, err)
	assert.Equal(t, types.ErrorTypeRuntime, result.ErrorType)
	assert.Contains(t, result.ErrorMessage, "1 results for 2 test cases")
}
