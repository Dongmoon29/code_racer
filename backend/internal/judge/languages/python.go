package languages

import (
	"fmt"

	"github.com/Dongmoon29/code_racer/internal/model"
)

type PyWrapper struct{}

func NewPyWrapper() *PyWrapper { return &PyWrapper{} }

func (w *PyWrapper) WrapBatch(code string, testCasesJSON string, problem *model.LeetCode) (string, error) {
	template := `
import json, sys

# user code
%s

def run_all():
    try:
        cases = json.loads('''%s''')
        results = []
        for c in cases:
            inputs = c if isinstance(c, list) else [c]
            out = %s(*inputs)
            results.append(out)
        print(json.dumps(results))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_all()`
	return fmt.Sprintf(template, code, testCasesJSON, problem.FunctionName), nil
}

func (w *PyWrapper) WrapSingle(code string, testCase string, problem *model.LeetCode) string {
	template := `
import json
import sys

# 사용자 코드
%s

# 테스트 실행
def run_test():
    try:
        test_case = json.loads('%s')
        inputs = test_case if isinstance(test_case, list) else [test_case]
        result = %s(*inputs)
        print(json.dumps(result))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_test()`
	return fmt.Sprintf(template, code, testCase, problem.FunctionName)
}
