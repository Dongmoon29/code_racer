package languages

import (
	"fmt"

	"github.com/Dongmoon29/code_racer/internal/model"
)

type JSWrapper struct{}

func NewJSWrapper() *JSWrapper { return &JSWrapper{} }

func (w *JSWrapper) WrapBatch(code string, testCasesJSON string, problem *model.LeetCode) (string, error) {
	template := `
// user code
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
	return fmt.Sprintf(template, code, testCasesJSON, problem.FunctionName), nil
}

func (w *JSWrapper) WrapSingle(code string, testCase string, problem *model.LeetCode) string {
	template := `
// 사용자 코드
%s

// 테스트 실행
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
	return fmt.Sprintf(template, code, testCase, problem.FunctionName)
}
