package golang

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/judge/parser"
	"github.com/Dongmoon29/code_racer/internal/model"
)

// Wrapper implements Go-specific code wrapping logic.
type Wrapper struct{}

func NewWrapper() *Wrapper { return &Wrapper{} }

func (g *Wrapper) WrapBatch(code string, testCasesJSON string, problem *model.Problem) (string, error) {
	// Clean user code - remove any existing wrapper functions
	userCode := strings.TrimSpace(code)

	// Remove common wrapper patterns carefully
	lines := strings.Split(userCode, "\n")
	var cleanedLines []string
	inImport := false
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "package ") {
			continue
		}
		if strings.HasPrefix(trimmed, "import ") {
			inImport = true
			continue
		}
		if inImport && trimmed == ")" {
			inImport = false
			continue
		}
		if inImport {
			continue
		}
		if strings.HasPrefix(trimmed, "func main()") {
			continue
		}
		cleanedLines = append(cleanedLines, line)
	}
	userCode = strings.Join(cleanedLines, "\n")
	userCode = strings.TrimSpace(userCode)

	// Infer parameter types from function signature
	sigParser := parser.NewGoSignatureParser()
	paramTypes := sigParser.InferParamTypesFromSignature(userCode, problem.FunctionName)

	// Fallback to common patterns if inference fails
	if len(paramTypes) == 0 {
		if problem.IOSchema.ParamTypes != "" {
			json.Unmarshal([]byte(problem.IOSchema.ParamTypes), &paramTypes)
		}
		if len(paramTypes) == 0 {
			paramTypes = []string{"array", "int"} // Common pattern: array + int
		}
	}

	template := `package main

import (
    "encoding/json"
    "fmt"
    "os"
)

// ===== 사용자 코드 (그대로 유지) =====
%s
// ====================================

// ===== 타입 변환 헬퍼 =====
func toInt(v interface{}) int {
    if f, ok := v.(float64); ok {
        return int(f)
    }
    if i, ok := v.(int); ok {
        return i
    }
    return 0
}

func toFloat(v interface{}) float64 {
    if f, ok := v.(float64); ok {
        return f
    }
    if i, ok := v.(int); ok {
        return float64(i)
    }
    return 0
}

func toBool(v interface{}) bool {
    if b, ok := v.(bool); ok {
        return b
    }
    return false
}

func toString(v interface{}) string {
    if s, ok := v.(string); ok {
        return s
    }
    return ""
}

func toIntSlice(v interface{}) []int {
    arr, ok := v.([]interface{})
    if !ok {
        return nil
    }
    result := make([]int, len(arr))
    for i, val := range arr {
        result[i] = toInt(val)
    }
    return result
}

func toIntSliceSlice(v interface{}) [][]int {
    arr, ok := v.([]interface{})
    if !ok {
        return nil
    }
    result := make([][]int, len(arr))
    for i, val := range arr {
        result[i] = toIntSlice(val)
    }
    return result
}

// ===== 실행 래퍼 =====
func main() {
    var testCases [][]interface{}
    if err := json.Unmarshal([]byte(os.Args[1]), &testCases); err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing test cases: %%v\n", err)
        os.Exit(1)
    }
    
    results := []interface{}{}
    for _, inputs := range testCases {
%s
        result := %s(%s)
        results = append(results, result)
    }
    
    output, _ := json.Marshal(results)
    fmt.Println(string(output))
}`

	argDecl, callArgs := goArgLines("inputs", paramTypes)
	return fmt.Sprintf(template, userCode, argDecl, problem.FunctionName, callArgs), nil
}

func (g *Wrapper) WrapSingle(code string, testCase string, problem *model.Problem) string {
	// Clean user code - remove any existing wrapper functions
	userCode := strings.TrimSpace(code)

	// Remove common wrapper patterns carefully
	lines := strings.Split(userCode, "\n")
	var cleanedLines []string
	inImport := false
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "package ") {
			continue
		}
		if strings.HasPrefix(trimmed, "import ") {
			inImport = true
			continue
		}
		if inImport && trimmed == ")" {
			inImport = false
			continue
		}
		if inImport {
			continue
		}
		if strings.HasPrefix(trimmed, "func main()") {
			continue
		}
		cleanedLines = append(cleanedLines, line)
	}
	userCode = strings.Join(cleanedLines, "\n")
	userCode = strings.TrimSpace(userCode)

	// Infer parameter types from function signature
	sigParser := parser.NewGoSignatureParser()
	paramTypes := sigParser.InferParamTypesFromSignature(userCode, problem.FunctionName)

	// Fallback to common patterns if inference fails
	if len(paramTypes) == 0 {
		if problem.IOSchema.ParamTypes != "" {
			json.Unmarshal([]byte(problem.IOSchema.ParamTypes), &paramTypes)
		}
		if len(paramTypes) == 0 {
			paramTypes = []string{"array", "int"} // Common pattern: array + int
		}
	}

	template := `package main

import (
    "encoding/json"
    "fmt"
    "os"
)

// ===== 사용자 코드 (그대로 유지) =====
%s
// ====================================

// ===== 타입 변환 헬퍼 =====
func toInt(v interface{}) int {
    if f, ok := v.(float64); ok {
        return int(f)
    }
    if i, ok := v.(int); ok {
        return i
    }
    return 0
}

func toFloat(v interface{}) float64 {
    if f, ok := v.(float64); ok {
        return f
    }
    if i, ok := v.(int); ok {
        return float64(i)
    }
    return 0
}

func toBool(v interface{}) bool {
    if b, ok := v.(bool); ok {
        return b
    }
    return false
}

func toString(v interface{}) string {
    if s, ok := v.(string); ok {
        return s
    }
    return ""
}

func toIntSlice(v interface{}) []int {
    arr, ok := v.([]interface{})
    if !ok {
        return nil
    }
    result := make([]int, len(arr))
    for i, val := range arr {
        result[i] = toInt(val)
    }
    return result
}

func toIntSliceSlice(v interface{}) [][]int {
    arr, ok := v.([]interface{})
    if !ok {
        return nil
    }
    result := make([][]int, len(arr))
    for i, val := range arr {
        result[i] = toIntSlice(val)
    }
    return result
}

// ===== 실행 래퍼 =====
func main() {
    var testCase []interface{}
    if err := json.Unmarshal([]byte('%s'), &testCase); err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing test case: %%v\n", err)
        os.Exit(1)
    }
    
%s
    result := %s(%s)
    
    output, _ := json.Marshal(result)
    fmt.Println(string(output))
}`

	argDecl, callArgs := goArgLines("testCase", paramTypes)
	return fmt.Sprintf(template, userCode, testCase, argDecl, problem.FunctionName, callArgs)
}

func goArgLines(varName string, paramTypes []string) (string, string) {
	decl := ""
	call := ""
	for i, pt := range paramTypes {
		idx := fmt.Sprintf("%s[%d]", varName, i)
		arg := fmt.Sprintf("arg%d", i)
		switch pt {
		case "number", "int":
			decl += fmt.Sprintf("    %s := toInt(%s)\n", arg, idx)
			call += arg
		case "float":
			decl += fmt.Sprintf("    %s := toFloat(%s)\n", arg, idx)
			call += arg
		case "boolean", "bool":
			decl += fmt.Sprintf("    %s := toBool(%s)\n", arg, idx)
			call += arg
		case "string":
			decl += fmt.Sprintf("    %s := toString(%s)\n", arg, idx)
			call += arg
		case "array", "int[]", "[]int":
			decl += fmt.Sprintf("    %s := toIntSlice(%s)\n", arg, idx)
			call += arg
		case "int[][]", "array[]":
			decl += fmt.Sprintf("    %s := toIntSliceSlice(%s)\n", arg, idx)
			call += arg
		default:
			decl += fmt.Sprintf("    %s := %s\n", arg, idx)
			call += arg
		}
		if i < len(paramTypes)-1 {
			call += ", "
		}
	}
	return decl, call
}
