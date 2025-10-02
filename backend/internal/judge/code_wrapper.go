package judge

import (
	"fmt"

	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
)

// CodeWrapper는 각 프로그래밍 언어별 코드 래핑을 처리합니다
type CodeWrapper struct {
	logger logger.Logger
}

func NewCodeWrapper(logger logger.Logger) *CodeWrapper {
	return &CodeWrapper{
		logger: logger,
	}
}

// WrapCode는 주어진 코드를 언어에 맞는 테스트 코드로 래핑합니다
func (w *CodeWrapper) WrapCode(code string, languageID int, testCase string, problem *model.LeetCode) (string, error) {
	w.logger.Info().
		Int("languageID", languageID).
		Str("testCase", testCase).
		Str("functionName", problem.FunctionName).
		Msg("Wrapping code for testing")

	wrapper, err := w.getLanguageWrapper(languageID)
	if err != nil {
		return "", err
	}

	return wrapper(code, testCase, problem), nil
}

// WrapCodeBatch는 모든 테스트 케이스를 한 번에 실행하는 배치 하니스를 생성합니다
func (w *CodeWrapper) WrapCodeBatch(code string, languageID int, testCasesJSON string, problem *model.LeetCode) (string, error) {
	w.logger.Info().
		Int("languageID", languageID).
		Str("functionName", problem.FunctionName).
		Msg("Wrapping code for batch testing")

	switch languageID {
	case constants.LanguageIDJavaScript:
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
	case constants.LanguageIDPython:
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
	case constants.LanguageIDGo:
		template := `
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

// user code
%s

func main() {
    var cases [][]interface{}
    if err := json.Unmarshal([]byte(%q), &cases); err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing cases: %v\n", err)
        os.Exit(1)
    }

    defer func() {
        if r := recover(); r != nil {
            fmt.Fprintf(os.Stderr, "Runtime error: %v\n", r)
            os.Exit(1)
        }
    }()

    results := make([]interface{}, 0, len(cases))
    for _, c := range cases {
        out := %s(c...)
        results = append(results, out)
    }

    outJSON, err := json.Marshal(results)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error marshaling results: %v\n", err)
        os.Exit(1)
    }
    fmt.Println(string(outJSON))
}`
		return fmt.Sprintf(template, code, testCasesJSON, problem.FunctionName), nil
	default:
		return "", fmt.Errorf("unsupported batch wrapper for language ID: %d", languageID)
	}
}

func (w *CodeWrapper) getLanguageWrapper(languageID int) (func(string, string, *model.LeetCode) string, error) {
	switch languageID {
	case constants.LanguageIDJavaScript:
		return w.wrapJavaScript, nil
	case constants.LanguageIDPython:
		return w.wrapPython, nil
	case constants.LanguageIDGo:
		return w.wrapGo, nil
	case constants.LanguageIDJava:
		return w.wrapJava, nil
	case constants.LanguageIDCPP:
		return w.wrapCPP, nil
	default:
		return nil, fmt.Errorf("unsupported programming language ID: %d", languageID)
	}
}

// 각 언어별 래핑 함수들...
func (w *CodeWrapper) wrapJavaScript(code, testCase string, problem *model.LeetCode) string {
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

// wrapPython Python 코드 래핑
func (w *CodeWrapper) wrapPython(code, testCase string, problem *model.LeetCode) string {
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

// wrapGo Go 코드 래핑
func (w *CodeWrapper) wrapGo(code, testCase string, problem *model.LeetCode) string {
	template := `
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

// 사용자 코드
%s

func main() {
    // 테스트 케이스 파싱
    var testCase []interface{}
    if err := json.Unmarshal([]byte(%q), &testCase); err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing test case: %%v\n", err)
        os.Exit(1)
    }

    // 함수 실행 및 결과 출력
    defer func() {
        if r := recover(); r != nil {
            fmt.Fprintf(os.Stderr, "Runtime error: %%v\n", r)
            os.Exit(1)
        }
    }()

    // 결과 실행 및 출력
    result := %s(testCase...)
    output, err := json.Marshal(result)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error marshaling result: %%v\n", err)
        os.Exit(1)
    }
    fmt.Println(string(output))
}`

	return fmt.Sprintf(template, code, testCase, problem.FunctionName)
}

// wrapJava Java 코드 래핑
func (w *CodeWrapper) wrapJava(code, testCase string, problem *model.LeetCode) string {
	template := `
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;

public class Solution {
    %s

    public static void main(String[] args) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Solution solution = new Solution();
            
            // 테스트 케이스 파싱
            List<Object> inputs = mapper.readValue("%s", List.class);
            
            // 함수 실행
            Object result = solution.%s(inputs.toArray());
            
            // 결과 출력
            System.out.println(mapper.writeValueAsString(result));
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            System.exit(1);
        }
    }
}`

	return fmt.Sprintf(template, code, testCase, problem.FunctionName)
}

// wrapCPP C++ 코드 래핑
func (w *CodeWrapper) wrapCPP(code, testCase string, problem *model.LeetCode) string {
	template := `
#include <iostream>
#include <string>
#include <vector>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

// 사용자 코드
%s

int main() {
    try {
        // 테스트 케이스 파싱
        json test_case = json::parse(R"(%s)");
        
        Solution solution;
        
        // 함수 실행
        auto result = solution.%s(test_case);
        
        // 결과 출력
        std::cout << result.dump() << std::endl;
        
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
}`

	return fmt.Sprintf(template, code, testCase, problem.FunctionName)
}
