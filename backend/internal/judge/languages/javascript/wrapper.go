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

	template := `// ===== 사용자 코드 (그대로 유지) =====
%s
// ====================================

// ===== 실행 래퍼 (자동 생성) =====
(function() {
    try {
        const testCases = JSON.parse(process.argv[2] || '[]');
        const results = testCases.map(inputs => {
            if (Array.isArray(inputs)) {
                return %s(...inputs);
            } else {
                return %s(inputs);
            }
        });
        console.log(JSON.stringify(results));
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
})();`
	return fmt.Sprintf(template, userCode, problem.FunctionName, problem.FunctionName), nil
}

func (w *Wrapper) WrapSingle(code string, testCase string, problem *model.Problem) string {
	// Clean user code - remove any existing wrapper functions
	userCode := strings.TrimSpace(code)

	// Remove common wrapper patterns
	userCode = strings.ReplaceAll(userCode, "function runAll()", "")
	userCode = strings.ReplaceAll(userCode, "runAll();", "")
	userCode = strings.ReplaceAll(userCode, "function runTest()", "")
	userCode = strings.ReplaceAll(userCode, "runTest();", "")
	userCode = strings.TrimSpace(userCode)

	template := `// ===== 사용자 코드 (그대로 유지) =====
%s
// ====================================

// ===== 실행 래퍼 (자동 생성) =====
(function() {
    try {
        const testCase = JSON.parse('%s');
        let result;
        if (Array.isArray(testCase)) {
            result = %s(...testCase);
        } else {
            result = %s(testCase);
        }
        console.log(JSON.stringify(result));
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
})();`
	return fmt.Sprintf(template, userCode, testCase, problem.FunctionName, problem.FunctionName)
}
