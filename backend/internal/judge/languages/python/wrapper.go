package python

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/model"
)

type Wrapper struct{}

func NewWrapper() *Wrapper { return &Wrapper{} }

func normalizePythonSubmission(code string) (futureImports string, userCode string) {
	var futures, rest []string
	for _, line := range strings.Split(strings.TrimSpace(code), "\n") {
		if strings.HasPrefix(line, "from __future__ import ") {
			futures = append(futures, line)
			continue
		}
		rest = append(rest, line)
	}
	return strings.Join(futures, "\n"), strings.TrimSpace(strings.Join(rest, "\n"))
}

func pythonPrelude(futureImports string) string {
	if futureImports == "" {
		return "from typing import *\nimport json\nimport sys"
	}
	return futureImports + "\nfrom typing import *\nimport json\nimport sys"
}

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
	futureImports, userCode := normalizePythonSubmission(code)
	prelude := pythonPrelude(futureImports)

	paramCount, err := schemaParamCount(problem)
	if err != nil {
		return "", err
	}

	// stdin is expected to be JSON array of test cases
	// - paramCount == 1: each element is the single argument value (may itself be list/dict)
	// - paramCount > 1: each element is a list of arguments
	if paramCount == 1 {
		template := `%s

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
		return fmt.Sprintf(template, prelude, userCode, problem.FunctionName), nil
	}

	template := `%s

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
	return fmt.Sprintf(template, prelude, userCode, problem.FunctionName), nil
}

func (w *Wrapper) WrapSingle(code string, testCase string, problem *model.Problem) (string, error) {
	paramCount, err := schemaParamCount(problem)
	futureImports, userCode := normalizePythonSubmission(code)
	prelude := pythonPrelude(futureImports)

	if err != nil {
		return "", err
	}

	if paramCount == 1 {
		template := `%s

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
		return fmt.Sprintf(template, prelude, userCode, problem.FunctionName), nil
	}

	template := `%s

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
	return fmt.Sprintf(template, prelude, userCode, problem.FunctionName), nil
}
