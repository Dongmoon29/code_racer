package python

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
			name: "with_heapq_import",
			code: `import heapq

def solution(nums):
    heapq.heapify(nums)
    return nums`,
			testCase: "[3,1,4,1,5]",
			expected: `import json
import sys
import heapq

# 사용자 코드
def solution(nums):
    heapq.heapify(nums)
    return nums

# 테스트 실행
def run_test():
    try:
        test_case = json.loads('[3,1,4,1,5]')
        inputs = test_case if isinstance(test_case, list) else [test_case]
        result = solution(*inputs)
        print(json.dumps(result))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_test()`,
		},
		{
			name: "with_multiple_imports",
			code: `import heapq
import math
from collections import defaultdict

def solution(nums):
    heapq.heapify(nums)
    return nums`,
			testCase: "[3,1,4,1,5]",
			expected: `import json
import sys
import heapq
import math
from collections import defaultdict

# 사용자 코드
def solution(nums):
    heapq.heapify(nums)
    return nums

# 테스트 실행
def run_test():
    try:
        test_case = json.loads('[3,1,4,1,5]')
        inputs = test_case if isinstance(test_case, list) else [test_case]
        result = solution(*inputs)
        print(json.dumps(result))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_test()`,
		},
		{
			name: "no_imports",
			code: `def solution(nums):
    return sorted(nums)`,
			testCase: "[3,1,4,1,5]",
			expected: `import json
import sys

# 사용자 코드
def solution(nums):
    return sorted(nums)

# 테스트 실행
def run_test():
    try:
        test_case = json.loads('[3,1,4,1,5]')
        inputs = test_case if isinstance(test_case, list) else [test_case]
        result = solution(*inputs)
        print(json.dumps(result))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_test()`,
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
			name: "with_heapq_import",
			code: `import heapq

def solution(nums):
    heapq.heapify(nums)
    return nums`,
			testCasesJSON: "[[3,1,4,1,5], [1,2,3]]",
			expected: `import json, sys
import heapq

# user code
def solution(nums):
    heapq.heapify(nums)
    return nums

def run_all():
    try:
        cases = json.loads('''[[3,1,4,1,5], [1,2,3]]''')
        results = []
        for c in cases:
            inputs = c if isinstance(c, list) else [c]
            out = solution(*inputs)
            results.append(out)
        print(json.dumps(results))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_all()`,
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
