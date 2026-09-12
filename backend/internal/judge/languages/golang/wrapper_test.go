package golang

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/stretchr/testify/assert"
)

func TestWrapper_WrapSingle_WithImports(t *testing.T) {
	wrapper := NewWrapper()

	problem := &model.Problem{
		FunctionName: "solution",
		IOSchema: model.IOSchema{
			ParamTypes: []string{"int[]"},
			ReturnType: "int[]",
		},
	}

	code := `import "sort"

func solution(nums []int) []int {
    sort.Ints(nums)
    return nums
}`

	result, err := wrapper.WrapSingle(code, "[[3,1,4,1,5]]", problem)
	assert.NoError(t, err)
	assert.Contains(t, result, "package main")
	assert.Contains(t, result, "\"sort\"")
	assert.Contains(t, result, "ioutil.ReadAll(os.Stdin)")
	assert.Contains(t, result, `"io/ioutil"`)
	assert.NotContains(t, result, `"io"`)
	assert.Contains(t, result, "var arg0 []int")
	assert.Contains(t, result, "json.Unmarshal(args[0], &arg0)")
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
		{"int64", "int64", true},
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

func TestWrapper_WrapSingle_ExecutesFullGoSubmission(t *testing.T) {
	if _, err := exec.LookPath("go"); err != nil {
		t.Skip("go executable is unavailable")
	}
	wrapper := NewWrapper()
	problem := &model.Problem{
		FunctionName: "twoSum",
		IOSchema: model.IOSchema{
			ParamTypes: []string{"int[]", "int"},
			ReturnType: "int[]",
		},
	}
	code := `package submission

import (
    j "encoding/json"
    "sort"
)

var _ = j.Valid

func helper(values []int) {
    sort.Ints(values)
}

func twoSum(nums []int, target int) []int {
    helper(nums)
    for left, right := 0, len(nums)-1; left < right; {
        sum := nums[left] + nums[right]
        if sum == target { return []int{nums[left], nums[right]} }
        if sum < target { left++ } else { right-- }
    }
    return nil
}`

	wrapped, err := wrapper.WrapSingle(code, `[[3,2,4],6]`, problem)
	assert.NoError(t, err)
	file := filepath.Join(t.TempDir(), "main.go")
	assert.NoError(t, os.WriteFile(file, []byte(wrapped), 0o600))
	cmd := exec.Command("go", "run", file)
	cmd.Stdin = strings.NewReader(`[[3,2,4],6]`)
	output, err := cmd.CombinedOutput()
	assert.NoError(t, err, string(output))
	assert.JSONEq(t, `[2,4]`, string(output))
}

func TestWrapper_WrapBatch_ExecutesAllArgumentArrays(t *testing.T) {
	wrapper := NewWrapper()
	problem := &model.Problem{
		FunctionName: "add",
		IOSchema: model.IOSchema{
			ParamTypes: []string{"int", "int"},
			ReturnType: "int",
		},
	}
	wrapperCode, err := wrapper.WrapBatch("func add(a int, b int) int { return a + b }", `[[1,2],[4,5]]`, problem)
	assert.NoError(t, err)
	file := filepath.Join(t.TempDir(), "main.go")
	assert.NoError(t, os.WriteFile(file, []byte(wrapperCode), 0o600))
	cmd := exec.Command("go", "run", file)
	cmd.Stdin = strings.NewReader(`[[1,2],[4,5]]`)
	output, err := cmd.CombinedOutput()
	assert.NoError(t, err, string(output))
	assert.JSONEq(t, `[3,9]`, string(output))
}
