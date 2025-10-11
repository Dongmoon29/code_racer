package python

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
			name: "with_heapq_import",
			code: `import heapq

def solution(nums):
    heapq.heapify(nums)
    return nums`,
			testCase: "[3,1,4,1,5]",
			expected: `import json
import sys

# ===== 사용자 코드 (그대로 유지) =====
import heapq

def solution(nums):
    heapq.heapify(nums)
    return nums
# ====================================

# ===== 실행 래퍼 (자동 생성) =====
if __name__ == "__main__":
    try:
        test_case = json.loads('[3,1,4,1,5]')
        if isinstance(test_case, list):
            result = solution(*test_case)
        else:
            result = solution(test_case)
        print(json.dumps(result))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)`,
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

# ===== 사용자 코드 (그대로 유지) =====
import heapq
import math
from collections import defaultdict

def solution(nums):
    heapq.heapify(nums)
    return nums
# ====================================

# ===== 실행 래퍼 (자동 생성) =====
if __name__ == "__main__":
    try:
        test_case = json.loads('[3,1,4,1,5]')
        if isinstance(test_case, list):
            result = solution(*test_case)
        else:
            result = solution(test_case)
        print(json.dumps(result))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)`,
		},
		{
			name: "no_imports",
			code: `def solution(nums):
    return sorted(nums)`,
			testCase: "[3,1,4,1,5]",
			expected: `import json
import sys

# ===== 사용자 코드 (그대로 유지) =====
def solution(nums):
    return sorted(nums)
# ====================================

# ===== 실행 래퍼 (자동 생성) =====
if __name__ == "__main__":
    try:
        test_case = json.loads('[3,1,4,1,5]')
        if isinstance(test_case, list):
            result = solution(*test_case)
        else:
            result = solution(test_case)
        print(json.dumps(result))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)`,
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

	problem := &model.Problem{
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
			expected: `import json
import sys

# ===== 사용자 코드 (그대로 유지) =====
import heapq

def solution(nums):
    heapq.heapify(nums)
    return nums
# ====================================

# ===== 실행 래퍼 (자동 생성) =====
if __name__ == "__main__":
    try:
        test_cases = json.loads(sys.argv[1] if len(sys.argv) > 1 else '[]')
        results = []
        for inputs in test_cases:
            if isinstance(inputs, list):
                result = solution(*inputs)
            else:
                result = solution(inputs)
            results.append(result)
        print(json.dumps(results))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)`,
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
