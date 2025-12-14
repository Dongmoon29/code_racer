package service

import (
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/stretchr/testify/assert"
)

func TestProblemService_ValidateTestCases_SingleParam_AllowsRawJSONValue(t *testing.T) {
	s := &problemService{}

	err := s.ValidateTestCases(
		[]model.CreateTestCaseRequest{
			{Input: `"()"`, ExpectedOutput: `true`},
			{Input: `121`, ExpectedOutput: `true`},
			{Input: `[1,2,3]`, ExpectedOutput: `true`},
		},
		model.CreateIOSchemaRequest{
			ParamTypes: []string{"string"},
			ReturnType: "boolean",
		},
	)
	assert.NoError(t, err)
}

func TestProblemService_ValidateTestCases_MultiParam_RequiresJSONArrayArgs(t *testing.T) {
	s := &problemService{}

	err := s.ValidateTestCases(
		[]model.CreateTestCaseRequest{
			{Input: `[[2,7,11,15],9]`, ExpectedOutput: `[0,1]`},
		},
		model.CreateIOSchemaRequest{
			ParamTypes: []string{"int[]", "int"},
			ReturnType: "int[]",
		},
	)
	assert.NoError(t, err)
}

func TestProblemService_ValidateTestCases_MultiParam_RejectsNonArrayInput(t *testing.T) {
	s := &problemService{}

	err := s.ValidateTestCases(
		[]model.CreateTestCaseRequest{
			{Input: `123`, ExpectedOutput: `[0,1]`},
		},
		model.CreateIOSchemaRequest{
			ParamTypes: []string{"int[]", "int"},
			ReturnType: "int[]",
		},
	)
	assert.Error(t, err)
}

func TestProblemService_ValidateTestCases_MultiParam_RejectsWrongArgCount(t *testing.T) {
	s := &problemService{}

	err := s.ValidateTestCases(
		[]model.CreateTestCaseRequest{
			{Input: `[[2,7,11,15]]`, ExpectedOutput: `[0,1]`},
		},
		model.CreateIOSchemaRequest{
			ParamTypes: []string{"int[]", "int"},
			ReturnType: "int[]",
		},
	)
	assert.Error(t, err)
}
