package python

import (
	"fmt"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/judge/parser"
	"github.com/Dongmoon29/code_racer/internal/model"
)

type Wrapper struct{}

func NewWrapper() *Wrapper { return &Wrapper{} }

func (w *Wrapper) WrapBatch(code string, testCasesJSON string, problem *model.Problem) (string, error) {
	// Parse user imports
	importParser := parser.NewImportParser()
	importInfo := importParser.ParseImports(code, 71) // Python language ID

	// Build imports section
	importsSection := "import json, sys"
	if len(importInfo.Imports) > 0 {
		importsSection += "\n" + strings.Join(importInfo.Imports, "\n")
	}

	template := `%s

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
	return fmt.Sprintf(template, importsSection, importInfo.Code, testCasesJSON, problem.FunctionName), nil
}

func (w *Wrapper) WrapSingle(code string, testCase string, problem *model.Problem) string {
	// Parse user imports
	importParser := parser.NewImportParser()
	importInfo := importParser.ParseImports(code, 71) // Python language ID

	// Build imports section
	importsSection := "import json\nimport sys"
	if len(importInfo.Imports) > 0 {
		importsSection += "\n" + strings.Join(importInfo.Imports, "\n")
	}

	template := `%s

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
	return fmt.Sprintf(template, importsSection, importInfo.Code, testCase, problem.FunctionName)
}
