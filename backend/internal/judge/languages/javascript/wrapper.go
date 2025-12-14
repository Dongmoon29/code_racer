package javascript

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/model"
)

type Wrapper struct{}

func NewWrapper() *Wrapper { return &Wrapper{} }

func schemaParamCount(problem *model.Problem) int {
	if problem == nil {
		return 1
	}
	if strings.TrimSpace(problem.IOSchema.ParamTypes) == "" {
		return 1
	}
	var pts []string
	if err := json.Unmarshal([]byte(problem.IOSchema.ParamTypes), &pts); err != nil || len(pts) == 0 {
		return 1
	}
	return len(pts)
}

func (w *Wrapper) WrapBatch(code string, testCasesJSON string, problem *model.Problem) (string, error) {
	// Clean user code - remove any existing wrapper functions
	userCode := strings.TrimSpace(code)

	// Remove common wrapper patterns
	userCode = strings.ReplaceAll(userCode, "function runAll()", "")
	userCode = strings.ReplaceAll(userCode, "runAll();", "")
	userCode = strings.ReplaceAll(userCode, "function runTest()", "")
	userCode = strings.ReplaceAll(userCode, "runTest();", "")
	userCode = strings.TrimSpace(userCode)

	paramCount := schemaParamCount(problem)

	// stdin is expected to be JSON array of test cases
	// - paramCount == 1: each element is the single argument value (may itself be array/object)
	// - paramCount > 1: each element is an array of arguments
	if paramCount == 1 {
		template := `// ===== 사용자 코드 (그대로 유지) =====
%s
// ====================================

// ===== 실행 래퍼 (자동 생성) =====
(function() {
    try {
        const raw = require('fs').readFileSync(0, 'utf-8').trim();
        if (!raw) return;
        const testCases = JSON.parse(raw);
        const results = testCases.map((value) => %s(value));
        process.stdout.write(JSON.stringify(results));
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
})();`
		return fmt.Sprintf(template, userCode, problem.FunctionName), nil
	}

	template := `// ===== 사용자 코드 (그대로 유지) =====
%s
// ====================================

// ===== 실행 래퍼 (자동 생성) =====
(function() {
    try {
        const raw = require('fs').readFileSync(0, 'utf-8').trim();
        if (!raw) return;
        const testCases = JSON.parse(raw);
        const results = testCases.map((args) => %s(...args));
        process.stdout.write(JSON.stringify(results));
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
})();`
	return fmt.Sprintf(template, userCode, problem.FunctionName), nil
}

func (w *Wrapper) WrapSingle(code string, testCase string, problem *model.Problem) string {
	paramCount := schemaParamCount(problem)

	// Clean user code - remove any existing wrapper functions
	userCode := strings.TrimSpace(code)

	// Remove common wrapper patterns
	userCode = strings.ReplaceAll(userCode, "function runAll()", "")
	userCode = strings.ReplaceAll(userCode, "runAll();", "")
	userCode = strings.ReplaceAll(userCode, "function runTest()", "")
	userCode = strings.ReplaceAll(userCode, "runTest();", "")
	userCode = strings.TrimSpace(userCode)

	if paramCount == 1 {
		template := `// ===== 사용자 코드 (그대로 유지) =====
%s
// ====================================

// ===== 실행 래퍼 (자동 생성) =====
(function() {
    try {
        const raw = require('fs').readFileSync(0, 'utf-8').trim();
        if (!raw) return;
        const value = JSON.parse(raw);
        const result = %s(value);
        process.stdout.write(JSON.stringify(result));
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
})();`
		return fmt.Sprintf(template, userCode, problem.FunctionName)
	}

	template := `// ===== 사용자 코드 (그대로 유지) =====
%s
// ====================================

// ===== 실행 래퍼 (자동 생성) =====
(function() {
    try {
        const raw = require('fs').readFileSync(0, 'utf-8').trim();
        if (!raw) return;
        const args = JSON.parse(raw);
        const result = %s(...args);
        process.stdout.write(JSON.stringify(result));
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
})();`
	return fmt.Sprintf(template, userCode, problem.FunctionName)
}
