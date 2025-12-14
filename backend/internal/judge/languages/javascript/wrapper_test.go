package javascript

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
			name: "with_require_import",
			code: `const fs = require('fs');

function solution(nums) {
    return nums.sort((a, b) => a - b);
}`,
			testCase: "[3,1,4,1,5]",
			expected: `// ===== 사용자 코드 (그대로 유지) =====
const fs = require('fs');

function solution(nums) {
    return nums.sort((a, b) => a - b);
}
// ====================================

// ===== 실행 래퍼 (자동 생성) =====
(function() {
    try {
        const raw = require('fs').readFileSync(0, 'utf-8').trim();
        if (!raw) return;
        const value = JSON.parse(raw);
        const result = solution(value);
        process.stdout.write(JSON.stringify(result));
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
			testCase: "[3,1,4,1,5]",
			expected: `// ===== 사용자 코드 (그대로 유지) =====
import { readFile } from 'fs';

function solution(nums) {
    return nums.sort((a, b) => a - b);
}
// ====================================

// ===== 실행 래퍼 (자동 생성) =====
(function() {
    try {
        const raw = require('fs').readFileSync(0, 'utf-8').trim();
        if (!raw) return;
        const value = JSON.parse(raw);
        const result = solution(value);
        process.stdout.write(JSON.stringify(result));
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
			testCase: "[3,1,4,1,5]",
			expected: `// ===== 사용자 코드 (그대로 유지) =====
const fs = require('fs');
const path = require('path');

function solution(nums) {
    return nums.sort((a, b) => a - b);
}
// ====================================

// ===== 실행 래퍼 (자동 생성) =====
(function() {
    try {
        const raw = require('fs').readFileSync(0, 'utf-8').trim();
        if (!raw) return;
        const value = JSON.parse(raw);
        const result = solution(value);
        process.stdout.write(JSON.stringify(result));
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
			testCase: "[3,1,4,1,5]",
			expected: `// ===== 사용자 코드 (그대로 유지) =====
function solution(nums) {
    return nums.sort((a, b) => a - b);
}
// ====================================

// ===== 실행 래퍼 (자동 생성) =====
(function() {
    try {
        const raw = require('fs').readFileSync(0, 'utf-8').trim();
        if (!raw) return;
        const value = JSON.parse(raw);
        const result = solution(value);
        process.stdout.write(JSON.stringify(result));
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
})();`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := wrapper.WrapSingle(tt.code, tt.testCase, problem)
			assert.Equal(t, tt.expected, result)
		})
	}
}
