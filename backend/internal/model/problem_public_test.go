package model

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestToPublicDetailResponse_HidesJudgeCases(t *testing.T) {
	problem := &Problem{
		Title:        "Secret cases",
		FunctionName: "solution",
		Examples:     []Example{{Input: "1", Output: "2"}},
		TestCases:    []TestCase{{Input: "secret", ExpectedOutput: "secret answer"}},
	}

	public := problem.ToPublicDetailResponse()
	assert.Empty(t, public.TestCases)
	assert.Empty(t, public.ExpectedOutputs)
	assert.Len(t, public.Examples, 1)

	admin := problem.ToDetailResponse()
	assert.Len(t, admin.TestCases, 1)
	assert.Equal(t, "secret answer", admin.ExpectedOutputs[0])
}
