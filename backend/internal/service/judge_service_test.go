package service

import (
	"io"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/judge"
	appLogger "github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/types"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
)

// mocks
type mockCodeWrapper struct {
	batchErr error
}

func (m *mockCodeWrapper) WrapCode(code string, languageID int, testCase string, problem *model.LeetCode) (string, error) {
	return "wrapped-single", nil
}

func (m *mockCodeWrapper) WrapCodeBatch(code string, languageID int, testCasesJSON string, problem *model.LeetCode) (string, error) {
	if m.batchErr != nil {
		return "", m.batchErr
	}
	return "wrapped-batch", nil
}

type mockJudge0Client struct{}

func (m *mockJudge0Client) SubmitCode(request types.Judge0Request) (*types.Judge0Response, error) {
	// Echo expected output as stdout to simulate pass
	return &types.Judge0Response{Stdout: request.ExpectedOutput, Time: 1.0, Memory: 12345}, nil
}

func buildTestLogger() appLogger.Logger {
	zl := zerolog.New(io.Discard).With().Timestamp().Logger()
	return appLogger.NewZerologLogger(zl)
}

func buildProblem() *model.LeetCode {
	return &model.LeetCode{
		Title:        "Sum",
		FunctionName: "solve",
		TestCases: model.TestCases{
			{Input: []interface{}{1, 2, 3}, Output: 6},
			{Input: []interface{}{4, 5, 6}, Output: 15},
		},
		TimeLimit:   5000,
		MemoryLimit: 128,
	}
}

func TestEvaluateCode_BatchSuccess(t *testing.T) {
	logger := buildTestLogger()
	svc := &judgeService{
		codeWrapper:       &mockCodeWrapper{},
		judge0Client:      &mockJudge0Client{},
		logger:            logger,
		functionExtractor: judge.NewFunctionExtractor(logger),
	}

	problem := buildProblem()
	code := "function solve(a,b,c){return a+b+c;}"

	res, err := svc.EvaluateCode(code, "javascript", problem)
	assert.NoError(t, err)
	assert.True(t, res.Passed)
	assert.Len(t, res.TestResults, 2)
	for _, tr := range res.TestResults {
		assert.True(t, tr.Passed)
	}
}

func TestEvaluateCode_FallbackPerTest_Success(t *testing.T) {
	logger := buildTestLogger()
	svc := &judgeService{
		codeWrapper:       &mockCodeWrapper{batchErr: assert.AnError},
		judge0Client:      &mockJudge0Client{},
		logger:            logger,
		functionExtractor: judge.NewFunctionExtractor(logger),
	}

	problem := buildProblem()
	code := "function solve(a,b,c){return a+b+c;}"

	res, err := svc.EvaluateCode(code, "javascript", problem)
	assert.NoError(t, err)
	assert.True(t, res.Passed)
	assert.Len(t, res.TestResults, 2)
	for _, tr := range res.TestResults {
		assert.True(t, tr.Passed)
	}
}

func TestEvaluateCode_FunctionNameMismatch(t *testing.T) {
	logger := buildTestLogger()
	svc := &judgeService{
		codeWrapper:       &mockCodeWrapper{},
		judge0Client:      &mockJudge0Client{},
		logger:            logger,
		functionExtractor: judge.NewFunctionExtractor(logger),
	}

	problem := buildProblem()
	// different function name
	code := "function other(a,b,c){return a+b+c;}"

	res, err := svc.EvaluateCode(code, "javascript", problem)
	assert.Error(t, err)
	assert.Nil(t, res)
}
