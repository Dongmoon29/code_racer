package python

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
	userCode = strings.ReplaceAll(userCode, "def run_all():", "")
	userCode = strings.ReplaceAll(userCode, "def run_test():", "")
	userCode = strings.ReplaceAll(userCode, "if __name__ == \"__main__\":", "")
	userCode = strings.ReplaceAll(userCode, "    run_all()", "")
	userCode = strings.ReplaceAll(userCode, "    run_test()", "")
	userCode = strings.TrimSpace(userCode)

	paramCount, err := schemaParamCount(problem)
	if err != nil {
		return "", err
	}

	// stdin is expected to be JSON array of test cases
	// - paramCount == 1: each element is the single argument value (may itself be list/dict)
	// - paramCount > 1: each element is a list of arguments
	if paramCount == 1 {
		template := `import json
import sys

# ===== User code (preserved as-is) =====
%s
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
            results.append(%s(value))
        sys.stdout.write(json.dumps(results))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)`
		return fmt.Sprintf(template, userCode, problem.FunctionName), nil
	}

	template := `import json
import sys

# ===== User code (preserved as-is) =====
%s
# ====================================

# ===== Execution wrapper (auto-generated) =====
if __name__ == "__main__":
    try:
        raw = sys.stdin.read().strip()
        if not raw:
            sys.exit(0)
        test_cases = json.loads(raw)
        results = []
        for args in test_cases:
            results.append(%s(*args))
        sys.stdout.write(json.dumps(results))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)`
	return fmt.Sprintf(template, userCode, problem.FunctionName), nil
}

func (w *Wrapper) WrapSingle(code string, testCase string, problem *model.Problem) string {
	paramCount, err := schemaParamCount(problem)

	// Clean user code - remove any existing wrapper functions
	userCode := strings.TrimSpace(code)

	// Remove common wrapper patterns
	userCode = strings.ReplaceAll(userCode, "def run_all():", "")
	userCode = strings.ReplaceAll(userCode, "def run_test():", "")
	userCode = strings.ReplaceAll(userCode, "if __name__ == \"__main__\":", "")
	userCode = strings.ReplaceAll(userCode, "    run_all()", "")
	userCode = strings.ReplaceAll(userCode, "    run_test()", "")
	userCode = strings.TrimSpace(userCode)

	if err != nil {
		return ""
	}

	if paramCount == 1 {
		template := `import json
import sys

# ===== User code (preserved as-is) =====
%s
# ====================================

# ===== Execution wrapper (auto-generated) =====
if __name__ == "__main__":
    try:
        raw = sys.stdin.read().strip()
        value = json.loads(raw)
        result = %s(value)
        sys.stdout.write(json.dumps(result))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)`
		return fmt.Sprintf(template, userCode, problem.FunctionName)
	}

	template := `import json
import sys

# ===== User code (preserved as-is) =====
%s
# ====================================

# ===== Execution wrapper (auto-generated) =====
if __name__ == "__main__":
    try:
        raw = sys.stdin.read().strip()
        args = json.loads(raw)
        result = %s(*args)
        sys.stdout.write(json.dumps(result))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)`
	return fmt.Sprintf(template, userCode, problem.FunctionName)
}
