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
		IOSchema: IOSchema{
			ParamTypes: []string{"string"},
			ReturnType: "string",
		},
	}

	public := problem.ToPublicDetailResponse()
	assert.Empty(t, public.TestCases)
	assert.Len(t, public.Examples, 1)
	assert.Len(t, public.IOTemplates, 3)

	admin := problem.ToDetailResponse()
	assert.Len(t, admin.TestCases, 1)
	assert.Equal(t, "secret answer", admin.TestCases[0].ExpectedOutput)
}
