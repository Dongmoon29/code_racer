package service

import (
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestProblemService_ProblemFromRequestNormalizesContract(t *testing.T) {
	s := &problemService{}
	problem, err := s.problemFromRequest(&model.CreateProblemRequest{
		Title:        "Example",
		Description:  "description",
		Constraints:  "constraints",
		Difficulty:   "Easy",
		FunctionName: " solve ",
		TimeLimit:    1000,
		MemoryLimit:  128,
		Examples:     []model.CreateExampleRequest{{Input: "1", Output: "1"}},
		TestCases:    []model.CreateTestCaseRequest{{Input: "[1]", ExpectedOutput: "1"}},
		IOSchema: model.CreateIOSchemaRequest{
			ParamTypes: []string{"number"},
			ReturnType: "number",
		},
	})

	require.NoError(t, err)
	assert.Equal(t, "solve", problem.FunctionName)
	assert.Equal(t, []string{"int"}, problem.IOSchema.ParamTypes)
	assert.Equal(t, "int", problem.IOSchema.ReturnType)
}

func TestProblemService_ValidateTestCases_SingleParam_UsesArgumentArray(t *testing.T) {
	s := &problemService{}

	err := s.ValidateTestCases(
		[]model.CreateTestCaseRequest{
			{Input: `["()"]`, ExpectedOutput: `true`},
		},
		model.CreateIOSchemaRequest{
			ParamTypes: []string{"string"},
			ReturnType: "boolean",
		},
	)
	assert.NoError(t, err)
}

func TestProblemService_ValidateTestCases_SingleParam_RejectsRawValue(t *testing.T) {
	s := &problemService{}
	err := s.ValidateTestCases(
		[]model.CreateTestCaseRequest{{Input: `121`, ExpectedOutput: `true`}},
		model.CreateIOSchemaRequest{ParamTypes: []string{"int"}, ReturnType: "bool"},
	)
	assert.ErrorContains(t, err, "JSON array")
}

func TestProblemService_ValidateTestCases_ValidatesArgumentAndOutputTypes(t *testing.T) {
	s := &problemService{}
	err := s.ValidateTestCases(
		[]model.CreateTestCaseRequest{{Input: `["not-an-int"]`, ExpectedOutput: `true`}},
		model.CreateIOSchemaRequest{ParamTypes: []string{"int"}, ReturnType: "bool"},
	)
	assert.ErrorContains(t, err, "expected int")

	err = s.ValidateTestCases(
		[]model.CreateTestCaseRequest{{Input: `[1]`, ExpectedOutput: `"true"`}},
		model.CreateIOSchemaRequest{ParamTypes: []string{"int"}, ReturnType: "bool"},
	)
	assert.ErrorContains(t, err, "expected bool")
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
