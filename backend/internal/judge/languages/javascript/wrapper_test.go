package javascript

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
			name: "with_require_import",
			code: `const fs = require('fs');

function solution(nums) {
    return nums.sort((a, b) => a - b);
}`,
			testCase: "[3,1,4,1,5]",
			expected: `const fs = require('fs');

// User code
function solution(nums) {
    return nums.sort((a, b) => a - b);
}

// Test execution
function runTest() {
    try {
        const testCase = JSON.parse("[3,1,4,1,5]");
        const inputs = Array.isArray(testCase) ? testCase : [testCase];
        const result = solution(...inputs);
        console.log(JSON.stringify(result));
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
}

runTest();`,
		},
		{
			name: "with_es6_import",
			code: `import { readFile } from 'fs';

function solution(nums) {
    return nums.sort((a, b) => a - b);
}`,
			testCase: "[3,1,4,1,5]",
			expected: `import { readFile } from 'fs';

// User code
function solution(nums) {
    return nums.sort((a, b) => a - b);
}

// Test execution
function runTest() {
    try {
        const testCase = JSON.parse("[3,1,4,1,5]");
        const inputs = Array.isArray(testCase) ? testCase : [testCase];
        const result = solution(...inputs);
        console.log(JSON.stringify(result));
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
}

runTest();`,
		},
		{
			name: "with_multiple_imports",
			code: `const fs = require('fs');
const path = require('path');

function solution(nums) {
    return nums.sort((a, b) => a - b);
}`,
			testCase: "[3,1,4,1,5]",
			expected: `const fs = require('fs');
const path = require('path');

// User code
function solution(nums) {
    return nums.sort((a, b) => a - b);
}

// Test execution
function runTest() {
    try {
        const testCase = JSON.parse("[3,1,4,1,5]");
        const inputs = Array.isArray(testCase) ? testCase : [testCase];
        const result = solution(...inputs);
        console.log(JSON.stringify(result));
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
}

runTest();`,
		},
		{
			name: "no_imports",
			code: `function solution(nums) {
    return nums.sort((a, b) => a - b);
}`,
			testCase: "[3,1,4,1,5]",
			expected: `// User code
function solution(nums) {
    return nums.sort((a, b) => a - b);
}

// Test execution
function runTest() {
    try {
        const testCase = JSON.parse("[3,1,4,1,5]");
        const inputs = Array.isArray(testCase) ? testCase : [testCase];
        const result = solution(...inputs);
        console.log(JSON.stringify(result));
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
}

runTest();`,
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
			name: "with_require_import",
			code: `const fs = require('fs');

function solution(nums) {
    return nums.sort((a, b) => a - b);
}`,
			testCasesJSON: "[[3,1,4,1,5], [1,2,3]]",
			expected: `const fs = require('fs');

// user code
function solution(nums) {
    return nums.sort((a, b) => a - b);
}

function runAll() {
  try {
    const cases = [[3,1,4,1,5], [1,2,3]];
    const results = [];
    for (let i = 0; i < cases.length; i++) {
      const inputs = Array.isArray(cases[i]) ? cases[i] : [cases[i]];
      const out = solution(...inputs);
      results.push(out);
    }
    console.log(JSON.stringify(results));
  } catch (e) {
    console.error(String(e));
    process.exit(1);
  }
}
runAll();`,
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
