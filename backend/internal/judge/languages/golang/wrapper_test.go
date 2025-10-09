package golang

import (
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/stretchr/testify/assert"
)

func TestWrapper_WrapSingle_WithImports(t *testing.T) {
	wrapper := NewWrapper()

	problem := &model.LeetCode{
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
    "sort"
)

// user code
func solution(nums []int) []int {
    sort.Ints(nums)
    return nums
}

func main() {
    var testCase []interface{}
    if err := json.Unmarshal([]byte("[3,1,4,1,5]"), &testCase); err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing test case: %v\n", err)
        os.Exit(1)
    }
    out := solution(testCase...)
    b, _ := json.Marshal(out)
    // Remove debug prints - use proper logging instead
}`,
		},
		{
			name: "with_multiple_imports",
			code: `import (
    "sort"
    "strings"
)

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
    "sort"
    "strings"
)

// user code
func solution(nums []int) []int {
    sort.Ints(nums)
    return nums
}

func main() {
    var testCase []interface{}
    if err := json.Unmarshal([]byte("[3,1,4,1,5]"), &testCase); err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing test case: %v\n", err)
        os.Exit(1)
    }
    out := solution(testCase...)
    b, _ := json.Marshal(out)
    // Remove debug prints - use proper logging instead
}`,
		},
		{
			name: "no_imports",
			code: `func solution(nums []int) []int {
    // Simple bubble sort
    for i := 0; i < len(nums); i++ {
        for j := 0; j < len(nums)-1-i; j++ {
            if nums[j] > nums[j+1] {
                nums[j], nums[j+1] = nums[j+1], nums[j]
            }
        }
    }
    return nums
}`,
			testCase: "[3,1,4,1,5]",
			expected: `package main

import (
    "encoding/json"
    "fmt"
    "os"
)

// user code
func solution(nums []int) []int {
    // Simple bubble sort
    for i := 0; i < len(nums); i++ {
        for j := 0; j < len(nums)-1-i; j++ {
            if nums[j] > nums[j+1] {
                nums[j], nums[j+1] = nums[j+1], nums[j]
            }
        }
    }
    return nums
}

func main() {
    var testCase []interface{}
    if err := json.Unmarshal([]byte("[3,1,4,1,5]"), &testCase); err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing test case: %v\n", err)
        os.Exit(1)
    }
    out := solution(testCase...)
    b, _ := json.Marshal(out)
    // Remove debug prints - use proper logging instead
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

func TestWrapper_WrapBatch_WithImports(t *testing.T) {
	wrapper := NewWrapper()

	problem := &model.LeetCode{
		FunctionName: "solution",
		InputFormat:  "array",
		OutputFormat: "array",
	}

	tests := []struct {
		name          string
		code          string
		testCasesJSON string
		expected      string
	}{
		{
			name: "with_sort_import",
			code: `import "sort"

func solution(nums []int) []int {
    sort.Ints(nums)
    return nums
}`,
			testCasesJSON: "[[3,1,4,1,5], [1,2,3]]",
			expected: `package main

import (
    "encoding/json"
    "fmt"
    "os"
    "sort"
)

// user code
func solution(nums []int) []int {
    sort.Ints(nums)
    return nums
}

func main() {
    var cases [][]interface{}
    if err := json.Unmarshal([]byte("[[3,1,4,1,5], [1,2,3]]"), &cases); err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing cases: %v\n", err)
        os.Exit(1)
    }
    results := make([]interface{}, 0, len(cases))
    for _, c := range cases {
        out := solution(c...)
        results = append(results, out)
    }
    b, _ := json.Marshal(results)
    // Remove debug prints - use proper logging instead
}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := wrapper.WrapBatch(tt.code, tt.testCasesJSON, problem)
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}
