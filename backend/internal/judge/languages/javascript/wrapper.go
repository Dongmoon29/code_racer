package javascript

import (
	"fmt"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/model"
)

type Wrapper struct{}

func NewWrapper() *Wrapper { return &Wrapper{} }

func (w *Wrapper) WrapBatch(code string, testCasesJSON string, problem *model.Problem) (string, error) {
	// Clean user code - remove any existing wrapper functions
	userCode := strings.TrimSpace(code)

	// Remove common wrapper patterns
	userCode = strings.ReplaceAll(userCode, "function runAll()", "")
	userCode = strings.ReplaceAll(userCode, "runAll();", "")
	userCode = strings.ReplaceAll(userCode, "function runTest()", "")
	userCode = strings.ReplaceAll(userCode, "runTest();", "")
	userCode = strings.TrimSpace(userCode)

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

func (w *Wrapper) WrapSingle(code string, testCase string, problem *model.Problem) (string, error) {
	// Clean user code - remove any existing wrapper functions
	userCode := strings.TrimSpace(code)

	// Remove common wrapper patterns
	userCode = strings.ReplaceAll(userCode, "function runAll()", "")
	userCode = strings.ReplaceAll(userCode, "runAll();", "")
	userCode = strings.ReplaceAll(userCode, "function runTest()", "")
	userCode = strings.ReplaceAll(userCode, "runTest();", "")
	userCode = strings.TrimSpace(userCode)

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
	return fmt.Sprintf(template, userCode, problem.FunctionName), nil
}
