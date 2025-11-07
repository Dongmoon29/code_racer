package python

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
	userCode = strings.ReplaceAll(userCode, "def run_all():", "")
	userCode = strings.ReplaceAll(userCode, "def run_test():", "")
	userCode = strings.ReplaceAll(userCode, "if __name__ == \"__main__\":", "")
	userCode = strings.ReplaceAll(userCode, "    run_all()", "")
	userCode = strings.ReplaceAll(userCode, "    run_test()", "")
	userCode = strings.TrimSpace(userCode)

	template := `import json
import sys

# ===== 사용자 코드 (그대로 유지) =====
%s
# ====================================

# ===== 실행 래퍼 (자동 생성) =====
if __name__ == "__main__":
    try:
        test_cases_json = %q
        test_cases = json.loads(test_cases_json)
        results = []
        for inputs in test_cases:
            if isinstance(inputs, list):
                result = %s(*inputs)
            else:
                result = %s(inputs)
            results.append(result)
        print(json.dumps(results))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)`
	return fmt.Sprintf(template, userCode, testCasesJSON, problem.FunctionName, problem.FunctionName), nil
}

func (w *Wrapper) WrapSingle(code string, testCase string, problem *model.Problem) string {
	// Clean user code - remove any existing wrapper functions
	userCode := strings.TrimSpace(code)

	// Remove common wrapper patterns
	userCode = strings.ReplaceAll(userCode, "def run_all():", "")
	userCode = strings.ReplaceAll(userCode, "def run_test():", "")
	userCode = strings.ReplaceAll(userCode, "if __name__ == \"__main__\":", "")
	userCode = strings.ReplaceAll(userCode, "    run_all()", "")
	userCode = strings.ReplaceAll(userCode, "    run_test()", "")
	userCode = strings.TrimSpace(userCode)

	template := `import json
import sys

# ===== 사용자 코드 (그대로 유지) =====
%s
# ====================================

# ===== 실행 래퍼 (자동 생성) =====
if __name__ == "__main__":
    try:
        test_case = json.loads('%s')
        if isinstance(test_case, list):
            result = %s(*test_case)
        else:
            result = %s(test_case)
        print(json.dumps(result))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)`
	return fmt.Sprintf(template, userCode, testCase, problem.FunctionName, problem.FunctionName)
}
