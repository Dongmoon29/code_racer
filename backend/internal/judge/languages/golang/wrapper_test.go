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
	}

	tests := []struct {
		name     string
		code     string
		testCase string
		expected string
	}{
		{
			name: "with_sort_import",
			code: `import "sort"

func solution(nums []int) []int {
    sort.Ints(nums)
    return nums
}`,
			testCase: "[3,1,4,1,5]",
			expected: `package main

import (
    "encoding/json"
    "fmt"
    "os"
)

// ===== 사용자 코드 (그대로 유지) =====
import "sort"

func solution(nums []int) []int {
    sort.Ints(nums)
    return nums
}
// ====================================

// ===== 타입 변환 헬퍼 =====
func toInt(v interface{}) int {
    if f, ok := v.(float64); ok {
        return int(f)
    }
    if i, ok := v.(int); ok {
        return i
    }
    return 0
}

func toFloat(v interface{}) float64 {
    if f, ok := v.(float64); ok {
        return f
    }
    if i, ok := v.(int); ok {
        return float64(i)
    }
    return 0
}

func toBool(v interface{}) bool {
    if b, ok := v.(bool); ok {
        return b
    }
    return false
}

func toString(v interface{}) string {
    if s, ok := v.(string); ok {
        return s
    }
    return ""
}

func toIntSlice(v interface{}) []int {
    arr, ok := v.([]interface{})
    if !ok {
        return nil
    }
    result := make([]int, len(arr))
    for i, val := range arr {
        result[i] = toInt(val)
    }
    return result
}

func toIntSliceSlice(v interface{}) [][]int {
    arr, ok := v.([]interface{})
    if !ok {
        return nil
    }
    result := make([][]int, len(arr))
    for i, val := range arr {
        result[i] = toIntSlice(val)
    }
    return result
}

// ===== 실행 래퍼 =====
func main() {
    var testCase []interface{}
    testCaseJSON := "[3,1,4,1,5]"
    if err := json.Unmarshal([]byte(testCaseJSON), &testCase); err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing test case: %v\n", err)
        os.Exit(1)
    }
    
    arg0 := toIntSlice(testCase[0])

    result := solution(arg0)
    
    output, _ := json.Marshal(result)
    fmt.Println(string(output))
}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := wrapper.WrapSingle(tt.code, tt.testCase, problem)
			assert.Equal(t, tt.expected, result)
		})
	}
}
