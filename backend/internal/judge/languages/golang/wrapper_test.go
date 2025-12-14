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
