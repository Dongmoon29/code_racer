package judge

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/judge/languages"
	golangWrapper "github.com/Dongmoon29/code_racer/internal/judge/languages/golang"
	jsWrapper "github.com/Dongmoon29/code_racer/internal/judge/languages/javascript"
	pyWrapper "github.com/Dongmoon29/code_racer/internal/judge/languages/python"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
)

// CodeWrapper는 각 프로그래밍 언어별 코드 래핑을 처리하는 개선된 서비스입니다
type CodeWrapper struct {
	logger       logger.Logger
	langWrappers map[int]languages.LanguageWrapper
	validators   map[int]CodeValidator
}

// CodeValidator는 코드 검증을 담당합니다
type CodeValidator interface {
	Validate(code string, problem *model.LeetCode) error
	ExtractFunctionName(code string) (string, error)
}

// DefaultCodeValidator는 기본 코드 검증기를 제공합니다
type DefaultCodeValidator struct{}

func (v *DefaultCodeValidator) Validate(code string, problem *model.LeetCode) error {
	if strings.TrimSpace(code) == "" {
		return fmt.Errorf("code cannot be empty")
	}
	if problem.FunctionName == "" {
		return fmt.Errorf("function name is required")
	}
	return nil
}

func (v *DefaultCodeValidator) ExtractFunctionName(code string) (string, error) {
	// 기본 구현: 간단한 함수명 추출
	lines := strings.Split(code, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.Contains(line, "function ") || strings.Contains(line, "def ") || strings.Contains(line, "func ") {
			// 간단한 추출 로직
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				return parts[1], nil
			}
		}
	}
	return "", fmt.Errorf("function name not found")
}

func NewCodeWrapper(logger logger.Logger) *CodeWrapper {
	cw := &CodeWrapper{
		logger: logger,
		langWrappers: map[int]languages.LanguageWrapper{
			constants.LanguageIDGo:         golangWrapper.NewWrapper(),
			constants.LanguageIDJavaScript: jsWrapper.NewWrapper(),
			constants.LanguageIDPython:     pyWrapper.NewWrapper(),
		},
		validators: map[int]CodeValidator{
			constants.LanguageIDGo:         &DefaultCodeValidator{},
			constants.LanguageIDJavaScript: &DefaultCodeValidator{},
			constants.LanguageIDPython:     &DefaultCodeValidator{},
			constants.LanguageIDJava:       &DefaultCodeValidator{},
			constants.LanguageIDCPP:        &DefaultCodeValidator{},
		},
	}
	return cw
}

// WrapCode는 주어진 코드를 언어에 맞는 테스트 코드로 래핑합니다 (개선된 버전)
func (w *CodeWrapper) WrapCode(code string, languageID int, testCase string, problem *model.LeetCode) (string, error) {
	w.logger.Info().
		Int("languageID", languageID).
		Str("testCase", testCase).
		Str("functionName", problem.FunctionName).
		Msg("Wrapping code for testing")

	// 코드 검증
	if validator, ok := w.validators[languageID]; ok {
		if err := validator.Validate(code, problem); err != nil {
			return "", fmt.Errorf("code validation failed: %w", err)
		}
	}

	// 테스트 케이스 검증
	if err := w.validateTestCase(testCase); err != nil {
		return "", fmt.Errorf("test case validation failed: %w", err)
	}

	// 언어별 래핑 실행
	if impl, ok := w.langWrappers[languageID]; ok {
		wrappedCode := impl.WrapSingle(code, testCase, problem)
		if wrappedCode == "" {
			return "", fmt.Errorf("failed to wrap code for language ID: %d", languageID)
		}
		return wrappedCode, nil
	}
	
	// Fallback to legacy inline wrappers for languages not yet split out
	switch languageID {
	case constants.LanguageIDJava:
		return w.wrapJava(code, testCase, problem), nil
	case constants.LanguageIDCPP:
		return w.wrapCPP(code, testCase, problem), nil
	default:
		return "", fmt.Errorf("unsupported programming language ID: %d", languageID)
	}
}

// validateTestCase validates the test case JSON
func (w *CodeWrapper) validateTestCase(testCase string) error {
	if strings.TrimSpace(testCase) == "" {
		return fmt.Errorf("test case cannot be empty")
	}
	
	// JSON 유효성 검사
	var testData interface{}
	if err := json.Unmarshal([]byte(testCase), &testData); err != nil {
		return fmt.Errorf("invalid test case JSON: %w", err)
	}
	
	return nil
}

// WrapCodeBatch는 모든 테스트 케이스를 한 번에 실행하는 배치 하니스를 생성합니다 (개선된 버전)
func (w *CodeWrapper) WrapCodeBatch(code string, languageID int, testCasesJSON string, problem *model.LeetCode) (string, error) {
	w.logger.Info().
		Int("languageID", languageID).
		Str("functionName", problem.FunctionName).
		Msg("Wrapping code for batch testing")

	// 코드 검증
	if validator, ok := w.validators[languageID]; ok {
		if err := validator.Validate(code, problem); err != nil {
			return "", fmt.Errorf("code validation failed: %w", err)
		}
	}

	// 배치 테스트 케이스 검증
	if err := w.validateBatchTestCases(testCasesJSON); err != nil {
		return "", fmt.Errorf("batch test cases validation failed: %w", err)
	}

	// 언어별 배치 래핑 실행
	if impl, ok := w.langWrappers[languageID]; ok {
		wrappedCode, err := impl.WrapBatch(code, testCasesJSON, problem)
		if err != nil {
			return "", fmt.Errorf("failed to wrap code for batch testing: %w", err)
		}
		if wrappedCode == "" {
			return "", fmt.Errorf("failed to wrap code for batch testing, language ID: %d", languageID)
		}
		return wrappedCode, nil
	}
	
	return "", fmt.Errorf("unsupported batch wrapper for language ID: %d", languageID)
}

// validateBatchTestCases validates the batch test cases JSON
func (w *CodeWrapper) validateBatchTestCases(testCasesJSON string) error {
	if strings.TrimSpace(testCasesJSON) == "" {
		return fmt.Errorf("batch test cases cannot be empty")
	}
	
	// JSON 유효성 검사
	var testData interface{}
	if err := json.Unmarshal([]byte(testCasesJSON), &testData); err != nil {
		return fmt.Errorf("invalid batch test cases JSON: %w", err)
	}
	
	// 배열인지 확인
	if _, ok := testData.([]interface{}); !ok {
		return fmt.Errorf("batch test cases must be an array")
	}
	
	return nil
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
func (w *CodeWrapper) goArgLines(varName string, paramTypes []string) (string, string) {
	// Build variable declarations and call arguments based on param types
	decl := ""
	call := ""
	for i, pt := range paramTypes {
		idx := fmt.Sprintf("%s[%d]", varName, i)
		argName := fmt.Sprintf("arg%d", i)
		switch pt {
		case "number", "int":
			decl += fmt.Sprintf("    %s := toInt(%s)\n", argName, idx)
			call += argName
		case "float":
			decl += fmt.Sprintf("    %s := toFloat(%s)\n", argName, idx)
			call += argName
		case "boolean", "bool":
			decl += fmt.Sprintf("    %s := toBool(%s)\n", argName, idx)
			call += argName
		case "string":
			decl += fmt.Sprintf("    %s := toString(%s)\n", argName, idx)
			call += argName
		case "array":
			decl += fmt.Sprintf("    %s := toIntSlice(%s)\n", argName, idx)
			call += argName
		default:
			// fallback: pass raw interface{}
			decl += fmt.Sprintf("    %s := %s\n", argName, idx)
			call += argName
		}
		if i < len(paramTypes)-1 {
			call += ", "
		}
	}
	return decl, call
}
func (w *CodeWrapper) wrapJavaScript(code, testCase string, problem *model.LeetCode) string {
	template := `
// User code
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

	return fmt.Sprintf(template, code, testCase, problem.FunctionName)
}

// wrapPython Python 코드 래핑
func (w *CodeWrapper) wrapPython(code, testCase string, problem *model.LeetCode) string {
	template := `
import json
import sys

# User code
%s

# Test execution
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
	if len(problem.IOSchema.ParamTypes) == 0 {
		// Fallback when schema missing: pass variadic args
		template := `
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

// User code
%s

func main() {
    // Test case parsing
    var testCase []interface{}
    if err := json.Unmarshal([]byte(%q), &testCase); err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing test case: %%v\n", err)
        os.Exit(1)
    }

    // Function execution and result output
    defer func() {
        if r := recover(); r != nil {
            fmt.Fprintf(os.Stderr, "Runtime error: %%v\n", r)
            os.Exit(1)
        }
    }()

    // Result execution and output
    result := %s(testCase...)
    output, err := json.Marshal(result)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error marshaling result: %%v\n", err)
        os.Exit(1)
    }
    // Remove debug prints - use proper logging instead
}`
		return fmt.Sprintf(template, code, testCase, problem.FunctionName)
	}

	argDecl, callArgs := w.goArgLines("testCase", problem.IOSchema.ParamTypes)
	template := `
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

// User code
%s

// helpers to coerce JSON-decoded values to expected types
func toInt(v interface{}) int {
    switch n := v.(type) {
    case float64:
        return int(n)
    case int:
        return n
    case int64:
        return int(n)
    default:
        return 0
    }
}

func toFloat(v interface{}) float64 {
    switch n := v.(type) {
    case float64:
        return n
    case int:
        return float64(n)
    case int64:
        return float64(n)
    default:
        return 0
    }
}

func toBool(v interface{}) bool {
    if b, ok := v.(bool); ok { return b }
    return false
}

func toString(v interface{}) string {
    if s, ok := v.(string); ok { return s }
    return ""
}

func toIntSlice(v interface{}) []int {
    arr, ok := v.([]interface{})
    if !ok { return nil }
    out := make([]int, 0, len(arr))
    for _, it := range arr { out = append(out, toInt(it)) }
    return out
}

func main() {
    // Test case parsing
    var testCase []interface{}
    if err := json.Unmarshal([]byte(%q), &testCase); err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing test case: %%v\n", err)
        os.Exit(1)
    }

    // Function execution and result output
    defer func() {
        if r := recover(); r != nil {
            fmt.Fprintf(os.Stderr, "Runtime error: %%v\n", r)
            os.Exit(1)
        }
    }()

    // Result execution and output
%s
    result := %s(%s)
    output, err := json.Marshal(result)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error marshaling result: %%v\n", err)
        os.Exit(1)
    }
    // Remove debug prints - use proper logging instead
}`

	return fmt.Sprintf(template, code, testCase, argDecl, problem.FunctionName, callArgs)
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
            
            // Test case parsing
            List<Object> inputs = mapper.readValue("%s", List.class);
            
            // Function execution
            Object result = solution.%s(inputs.toArray());
            
            // Result output
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

// User code
%s

int main() {
    try {
        // Test case parsing
        json test_case = json::parse(R"(%s)");
        
        Solution solution;
        
        // Function execution
        auto result = solution.%s(test_case);
        
        // Result output
        std::cout << result.dump() << std::endl;
        
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
}`

	return fmt.Sprintf(template, code, testCase, problem.FunctionName)
}
