package javascript

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/model"
)

type Wrapper struct{}

func NewWrapper() *Wrapper { return &Wrapper{} }

func schemaParamCount(problem *model.Problem) (int, error) {
	if problem == nil {
		return 0, fmt.Errorf("problem is nil")
	}
	raw := strings.TrimSpace(problem.IOSchema.ParamTypes)
	if raw == "" {
		return 0, fmt.Errorf("missing io_schema.param_types")
	}
	var pts []string
	if err := json.Unmarshal([]byte(raw), &pts); err != nil || len(pts) == 0 {
		return 0, fmt.Errorf("invalid io_schema.param_types")
	}
	return len(pts), nil
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

	paramCount, err := schemaParamCount(problem)
	if err != nil {
		return "", err
	}

	// stdin is expected to be JSON array of test cases
	// - paramCount == 1: each element is the single argument value (may itself be array/object)
	// - paramCount > 1: each element is an array of arguments
	if paramCount == 1 {
		template := `// ===== User code (preserved as-is) =====
%s
// ====================================

// ===== Execution wrapper (auto-generated) =====
(function() {
    try {
        const raw = require('fs').readFileSync(0, 'utf-8').trim();
        if (!raw) return;
        const testCases = JSON.parse(raw);
        const results = testCases.map((value) => {
            const result = %s(value);
            return result === undefined ? null : result;
        });
        process.stdout.write(JSON.stringify(results));
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
})();`
		return fmt.Sprintf(template, userCode, problem.FunctionName), nil
	}

	template := `// ===== User code (preserved as-is) =====
%s
// ====================================

// ===== Execution wrapper (auto-generated) =====
(function() {
    try {
        const raw = require('fs').readFileSync(0, 'utf-8').trim();
        if (!raw) return;
        const testCases = JSON.parse(raw);
        const results = testCases.map((args) => {
            const result = %s(...args);
            return result === undefined ? null : result;
        });
        process.stdout.write(JSON.stringify(results));
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
})();`
	return fmt.Sprintf(template, userCode, problem.FunctionName), nil
}

func (w *Wrapper) WrapSingle(code string, testCase string, problem *model.Problem) string {
	paramCount, err := schemaParamCount(problem)

	// Clean user code - remove any existing wrapper functions
	userCode := strings.TrimSpace(code)

	// Remove common wrapper patterns
	userCode = strings.ReplaceAll(userCode, "function runAll()", "")
	userCode = strings.ReplaceAll(userCode, "runAll();", "")
	userCode = strings.ReplaceAll(userCode, "function runTest()", "")
	userCode = strings.ReplaceAll(userCode, "runTest();", "")
	userCode = strings.TrimSpace(userCode)

	if err != nil {
		return ""
	}

	if paramCount == 1 {
		template := `// ===== User code (preserved as-is) =====
%s
// ====================================

// ===== Execution wrapper (auto-generated) =====
(function() {
    try {
        const raw = require('fs').readFileSync(0, 'utf-8').trim();
        if (!raw) return;
        const value = JSON.parse(raw);
        const result = %s(value);
        const output = result === undefined ? 'null' : JSON.stringify(result);
        process.stdout.write(output);
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
})();`
		return fmt.Sprintf(template, userCode, problem.FunctionName)
	}

	template := `// ===== User code (preserved as-is) =====
%s
// ====================================

// ===== Execution wrapper (auto-generated) =====
(function() {
    try {
        const raw = require('fs').readFileSync(0, 'utf-8').trim();
        if (!raw) return;
        const args = JSON.parse(raw);
        const result = %s(...args);
        const output = result === undefined ? 'null' : JSON.stringify(result);
        process.stdout.write(output);
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
})();`
	return fmt.Sprintf(template, userCode, problem.FunctionName)
}
