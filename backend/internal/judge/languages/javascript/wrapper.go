package javascript

import (
	"fmt"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/judge/parser"
	"github.com/Dongmoon29/code_racer/internal/model"
)

type Wrapper struct{}

func NewWrapper() *Wrapper { return &Wrapper{} }

func (w *Wrapper) WrapBatch(code string, testCasesJSON string, problem *model.LeetCode) (string, error) {
	// Use simple regex-based parser for JavaScript
	parser := parser.NewJavaScriptParser()
	imports := parser.GetImports(code)
	userCode := parser.GetUserCode(code)

	// Build imports section
	importsSection := ""
	if len(imports) > 0 {
		importsSection = strings.Join(imports, "\n") + "\n\n"
	}

	template := `%s// user code
%s

function runAll() {
  try {
    const cases = %s;
    const results = [];
    for (let i = 0; i < cases.length; i++) {
      const inputs = Array.isArray(cases[i]) ? cases[i] : [cases[i]];
      const out = %s(...inputs);
      results.push(out);
    }
    console.log(JSON.stringify(results));
  } catch (e) {
    console.error(String(e));
    process.exit(1);
  }
}
runAll();`
	return fmt.Sprintf(template, importsSection, userCode, testCasesJSON, problem.FunctionName), nil
}

func (w *Wrapper) WrapSingle(code string, testCase string, problem *model.LeetCode) string {
	// Use simple regex-based parser for JavaScript
	parser := parser.NewJavaScriptParser()
	imports := parser.GetImports(code)
	userCode := parser.GetUserCode(code)

	// Build imports section
	importsSection := ""
	if len(imports) > 0 {
		importsSection = strings.Join(imports, "\n") + "\n\n"
	}

	template := `%s// User code
%s

// Test execution
function runTest() {
    try {
        const testCase = JSON.parse(%q);
        const inputs = Array.isArray(testCase) ? testCase : [testCase];
        const result = %s(...inputs);
        console.log(JSON.stringify(result));
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
}

runTest();`
	return fmt.Sprintf(template, importsSection, userCode, testCase, problem.FunctionName)
}
