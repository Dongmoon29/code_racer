package javascript

import (
	"os/exec"
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

	tests := []struct {
		name     string
		code     string
		testCase string
		expected string
	}{
		{
			name: "with_require_import",
			code: `const fs = require('fs');

function solution(nums) {
    return nums.sort((a, b) => a - b);
}`,
			testCase: "[[3,1,4,1,5]]",
			expected: `// ===== User code (preserved as-is) =====
const fs = require('fs');

function solution(nums) {
    return nums.sort((a, b) => a - b);
}
// ====================================

// ===== Execution wrapper (auto-generated) =====
(function() {
    try {
        const raw = require('fs').readFileSync(0, 'utf-8').trim();
        if (!raw) return;
        const args = JSON.parse(raw);
        const result = solution(...args);
        const output = result === undefined ? 'null' : JSON.stringify(result);
        process.stdout.write(output);
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
})();`,
		},
		{
			name: "with_es6_import",
			code: `import { readFile } from 'fs';

function solution(nums) {
    return nums.sort((a, b) => a - b);
}`,
			testCase: "[[3,1,4,1,5]]",
			expected: `// ===== User code (preserved as-is) =====
import { readFile } from 'fs';

function solution(nums) {
    return nums.sort((a, b) => a - b);
}
// ====================================

// ===== Execution wrapper (auto-generated) =====
(function() {
    try {
        const raw = require('fs').readFileSync(0, 'utf-8').trim();
        if (!raw) return;
        const args = JSON.parse(raw);
        const result = solution(...args);
        const output = result === undefined ? 'null' : JSON.stringify(result);
        process.stdout.write(output);
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
})();`,
		},
		{
			name: "with_multiple_imports",
			code: `const fs = require('fs');
const path = require('path');

function solution(nums) {
    return nums.sort((a, b) => a - b);
}`,
			testCase: "[[3,1,4,1,5]]",
			expected: `// ===== User code (preserved as-is) =====
const fs = require('fs');
const path = require('path');

function solution(nums) {
    return nums.sort((a, b) => a - b);
}
// ====================================

// ===== Execution wrapper (auto-generated) =====
(function() {
    try {
        const raw = require('fs').readFileSync(0, 'utf-8').trim();
        if (!raw) return;
        const args = JSON.parse(raw);
        const result = solution(...args);
        const output = result === undefined ? 'null' : JSON.stringify(result);
        process.stdout.write(output);
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
})();`,
		},
		{
			name: "no_imports",
			code: `function solution(nums) {
    return nums.sort((a, b) => a - b);
}`,
			testCase: "[[3,1,4,1,5]]",
			expected: `// ===== User code (preserved as-is) =====
function solution(nums) {
    return nums.sort((a, b) => a - b);
}
// ====================================

// ===== Execution wrapper (auto-generated) =====
(function() {
    try {
        const raw = require('fs').readFileSync(0, 'utf-8').trim();
        if (!raw) return;
        const args = JSON.parse(raw);
        const result = solution(...args);
        const output = result === undefined ? 'null' : JSON.stringify(result);
        process.stdout.write(output);
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
})();`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := wrapper.WrapSingle(tt.code, tt.testCase, problem)
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestWrapper_WrapSingle_ExecutesArgumentArray(t *testing.T) {
	node, err := exec.LookPath("node")
	if err != nil {
		t.Skip("node executable is unavailable")
	}
	wrapper := NewWrapper()
	problem := &model.Problem{
		FunctionName: "twoSum",
		IOSchema: model.IOSchema{
			ParamTypes: []string{"int[]", "int"},
			ReturnType: "int[]",
		},
	}
	code := `function twoSum(nums, target) {
  const seen = new Map();
  for (let index = 0; index < nums.length; index++) {
    const complement = target - nums[index];
    if (seen.has(complement)) return [seen.get(complement), index];
    seen.set(nums[index], index);
  }
  return [];
}`

	wrapped, err := wrapper.WrapSingle(code, `[[2,7,11,15],9]`, problem)
	assert.NoError(t, err)
	cmd := exec.Command(node, "-e", wrapped)
	cmd.Stdin = strings.NewReader(`[[2,7,11,15],9]`)
	output, err := cmd.CombinedOutput()
	assert.NoError(t, err, string(output))
	assert.JSONEq(t, `[0,1]`, string(output))
}
