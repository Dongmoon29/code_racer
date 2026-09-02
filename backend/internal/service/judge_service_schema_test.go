package service

import (
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/stretchr/testify/assert"
)

func TestJudgeService_validateProblemIOSchema_OK(t *testing.T) {
	s := &judgeService{}
	err := s.validateProblemIOSchema(&model.Problem{
		FunctionName: "twoSum",
		IOSchema: model.IOSchema{
			ParamTypes: `["int[]","int"]`,
			ReturnType: "int[]",
		},
		TestCases: []model.TestCase{{Input: "[]", ExpectedOutput: "[]"}},
	})
	assert.NoError(t, err)
}

func TestJudgeService_validateProblemIOSchema_MissingParamTypes(t *testing.T) {
	s := &judgeService{}
	err := s.validateProblemIOSchema(&model.Problem{
		FunctionName: "twoSum",
		IOSchema: model.IOSchema{
			ParamTypes: "",
			ReturnType: "int[]",
		},
		TestCases: []model.TestCase{{Input: "[]", ExpectedOutput: "[]"}},
	})
	assert.Error(t, err)
}

func TestJudgeService_validateProblemIOSchema_InvalidParamTypesJSON(t *testing.T) {
	s := &judgeService{}
	err := s.validateProblemIOSchema(&model.Problem{
		FunctionName: "twoSum",
		IOSchema: model.IOSchema{
			ParamTypes: `not-json`,
			ReturnType: "int[]",
		},
		TestCases: []model.TestCase{{Input: "[]", ExpectedOutput: "[]"}},
	})
	assert.Error(t, err)
}

func TestJudgeService_validateProblemIOSchema_MissingReturnType(t *testing.T) {
	s := &judgeService{}
	err := s.validateProblemIOSchema(&model.Problem{
		FunctionName: "twoSum",
		IOSchema: model.IOSchema{
			ParamTypes: `["int[]","int"]`,
			ReturnType: "",
		},
		TestCases: []model.TestCase{{Input: "[]", ExpectedOutput: "[]"}},
	})
	assert.Error(t, err)
}

func TestJudgeService_validateProblemIOSchema_RequiresTestCases(t *testing.T) {
	s := &judgeService{}
	err := s.validateProblemIOSchema(&model.Problem{
		FunctionName: "twoSum",
		IOSchema: model.IOSchema{
			ParamTypes: `["int[]","int"]`,
			ReturnType: "int[]",
		},
	})
	assert.EqualError(t, err, "problem has no test cases")
}
