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
		IOSchema: model.IOSchema{
			ParamTypes: `["int[]"]`,
			ReturnType: "int[]",
		},
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

# ===== User code (preserved as-is) =====
import heapq

def solution(nums):
    heapq.heapify(nums)
    return nums
# ====================================

# ===== Execution wrapper (auto-generated) =====
if __name__ == "__main__":
    try:
        raw = sys.stdin.read().strip()
        value = json.loads(raw)
        result = solution(value)
        sys.stdout.write(json.dumps(result))
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

# ===== User code (preserved as-is) =====
import heapq
import math
from collections import defaultdict

def solution(nums):
    heapq.heapify(nums)
    return nums
# ====================================

# ===== Execution wrapper (auto-generated) =====
if __name__ == "__main__":
    try:
        raw = sys.stdin.read().strip()
        value = json.loads(raw)
        result = solution(value)
        sys.stdout.write(json.dumps(result))
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

# ===== User code (preserved as-is) =====
def solution(nums):
    return sorted(nums)
# ====================================

# ===== Execution wrapper (auto-generated) =====
if __name__ == "__main__":
    try:
        raw = sys.stdin.read().strip()
        value = json.loads(raw)
        result = solution(value)
        sys.stdout.write(json.dumps(result))
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
		IOSchema: model.IOSchema{
			ParamTypes: `["int[]"]`,
			ReturnType: "int[]",
		},
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

# ===== User code (preserved as-is) =====
import heapq

def solution(nums):
    heapq.heapify(nums)
    return nums
# ====================================

# ===== Execution wrapper (auto-generated) =====
if __name__ == "__main__":
    try:
        raw = sys.stdin.read().strip()
        if not raw:
            sys.exit(0)
        test_cases = json.loads(raw)
        results = []
        for value in test_cases:
            results.append(solution(value))
        sys.stdout.write(json.dumps(results))
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


