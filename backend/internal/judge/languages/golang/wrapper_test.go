package golang

import (
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/stretchr/testify/assert"
)

func TestWrapper_WrapSingle_WithImports(t *testing.T) {
	wrapper := NewWrapper()

	problem := &model.Problem{
		FunctionName: "solution",
		InputFormat:  "array",
		OutputFormat: "array",
		IOSchema: model.IOSchema{
			ParamTypes: `["int[]"]`,
			ReturnType: "int[]",
		},
	}

	code := `import "sort"

func solution(nums []int) []int {
    sort.Ints(nums)
    return nums
}`

	result := wrapper.WrapSingle(code, "[3,1,4,1,5]", problem)
	assert.Contains(t, result, "package main")
	assert.Contains(t, result, "\"sort\"")
	assert.Contains(t, result, "ioutil.ReadAll(os.Stdin)")
	assert.Contains(t, result, "var arg0 []int")
	assert.Contains(t, result, "json.Unmarshal([]byte(raw), &arg0)")
	assert.Contains(t, result, "result := solution(arg0)")
	assert.NotContains(t, result, "testCaseJSON :=")
}

func TestGoTypeFromSchema_OnlyAllowsSupportedSchemaTypes(t *testing.T) {
	tests := []struct {
		in   string
		want string
		ok   bool
	}{
		{"int", "int", true},
		{"number", "int", true},
		{"bool", "bool", true},
		{"boolean", "bool", true},
		{"string", "string", true},
		{"int[]", "[]int", true},
		{"array", "[]int", true},
		{"int[][]", "[][]int", true},
		{"string[]", "[]string", true},
		{"int64", "", false},
		{"map[string]int", "", false},
		{"", "", false},
		{"\"bad\"; os.Exit(1)", "", false},
	}

	for _, tt := range tests {
		got, ok := goTypeFromSchema(tt.in)
		assert.Equal(t, tt.ok, ok)
		if ok {
			assert.Equal(t, tt.want, got)
		}
	}
}
