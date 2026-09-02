package model

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGenerateStarterTemplates_FromSingleContract(t *testing.T) {
	templates := GenerateStarterTemplates("twoSum", []string{"int[]", "int"}, "int[]")
	require.Len(t, templates, 3)

	byLanguage := make(map[string]string, len(templates))
	for _, template := range templates {
		byLanguage[template.Language] = template.Code
	}
	assert.Contains(t, byLanguage["javascript"], "function twoSum(arg0, arg1)")
	assert.Contains(t, byLanguage["python"], "def twoSum(arg0: List[int], arg1: int) -> List[int]")
	assert.Contains(t, byLanguage["go"], "func twoSum(arg0 []int, arg1 int) []int")
}

func TestGenerateStarterTemplates_InvalidContractReturnsNone(t *testing.T) {
	assert.Empty(t, GenerateStarterTemplates("bad-name", []string{"int"}, "int"))
	assert.Empty(t, GenerateStarterTemplates("solve", []string{"map"}, "int"))
}

func TestValidateJSONValue_UsesSharedSchemaVocabulary(t *testing.T) {
	assert.NoError(t, ValidateJSONValue(json.RawMessage(`[[1,2],[3,4]]`), "int[][]"))
	assert.NoError(t, ValidateJSONValue(json.RawMessage(`[true,false]`), "bool[]"))
	assert.Error(t, ValidateJSONValue(json.RawMessage(`[1,"2"]`), "int[]"))
	assert.Error(t, ValidateJSONValue(json.RawMessage(`1.5`), "int"))
}

func TestValidateJSONValue_RejectsMultipleValues(t *testing.T) {
	assert.Error(t, ValidateJSONValue(json.RawMessage(`1 2`), "int"))
}

func TestNormalizeFunctionContract(t *testing.T) {
	params, returnType, err := NormalizeFunctionContract("solve", []string{"number", "[]int"}, "boolean")
	require.NoError(t, err)
	assert.Equal(t, []string{"int", "int[]"}, params)
	assert.Equal(t, "bool", returnType)
}
