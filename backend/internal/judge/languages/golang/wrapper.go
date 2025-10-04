package golang

import (
    "fmt"

    "github.com/Dongmoon29/code_racer/internal/model"
)

// Wrapper implements Go-specific code wrapping logic.
type Wrapper struct{}

func NewWrapper() *Wrapper { return &Wrapper{} }

func (g *Wrapper) WrapBatch(code string, testCasesJSON string, problem *model.LeetCode) (string, error) {
    if len(problem.IOSchema.ParamTypes) == 0 {
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
        fmt.Fprintf(os.Stderr, "Error parsing cases: %%v\n", err)
        os.Exit(1)
    }
    results := make([]interface{}, 0, len(cases))
    for _, c := range cases {
        out := %s(c...)
        results = append(results, out)
    }
    b, _ := json.Marshal(results)
    // Remove debug prints - use proper logging instead
}`
        return fmt.Sprintf(template, code, testCasesJSON, problem.FunctionName), nil
    }

    argDecl, callArgs := goArgLines("c", problem.IOSchema.ParamTypes)
    template := `
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

// user code
%s

func toInt(v interface{}) int { if f, ok := v.(float64); ok { return int(f) }; if i, ok := v.(int); ok { return i }; return 0 }
func toFloat(v interface{}) float64 { if f, ok := v.(float64); ok { return f }; if i, ok := v.(int); ok { return float64(i) }; return 0 }
func toBool(v interface{}) bool { if b, ok := v.(bool); ok { return b }; return false }
func toString(v interface{}) string { if s, ok := v.(string); ok { return s }; return "" }
func toIntSlice(v interface{}) []int { arr, ok := v.([]interface{}); if !ok { return nil }; out := make([]int,0,len(arr)); for _, it := range arr { out = append(out, toInt(it)) }; return out }

func main() {
    var cases [][]interface{}
    if err := json.Unmarshal([]byte(%q), &cases); err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing cases: %%v\n", err)
        os.Exit(1)
    }
    results := make([]interface{}, 0, len(cases))
    for _, c := range cases {
%s
        out := %s(%s)
        results = append(results, out)
    }
    b, _ := json.Marshal(results)
    // Remove debug prints - use proper logging instead
}`
    return fmt.Sprintf(template, code, testCasesJSON, argDecl, problem.FunctionName, callArgs), nil
}

func (g *Wrapper) WrapSingle(code string, testCase string, problem *model.LeetCode) string {
    if len(problem.IOSchema.ParamTypes) == 0 {
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
    var testCase []interface{}
    if err := json.Unmarshal([]byte(%q), &testCase); err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing test case: %%v\n", err)
        os.Exit(1)
    }
    out := %s(testCase...)
    b, _ := json.Marshal(out)
    // Remove debug prints - use proper logging instead
}`
        return fmt.Sprintf(template, code, testCase, problem.FunctionName)
    }
    argDecl, callArgs := goArgLines("testCase", problem.IOSchema.ParamTypes)
    template := `
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

// user code
%s

func toInt(v interface{}) int { if f, ok := v.(float64); ok { return int(f) }; if i, ok := v.(int); ok { return i }; return 0 }
func toFloat(v interface{}) float64 { if f, ok := v.(float64); ok { return f } ; if i, ok := v.(int); ok { return float64(i) }; return 0 }
func toBool(v interface{}) bool { if b, ok := v.(bool); ok { return b }; return false }
func toString(v interface{}) string { if s, ok := v.(string); ok { return s }; return "" }
func toIntSlice(v interface{}) []int { arr, ok := v.([]interface{}); if !ok { return nil }; out := make([]int,0,len(arr)); for _, it := range arr { out = append(out, toInt(it)) }; return out }

func main() {
    var testCase []interface{}
    if err := json.Unmarshal([]byte(%q), &testCase); err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing test case: %%v\n", err)
        os.Exit(1)
    }
%s
    out := %s(%s)
    b, _ := json.Marshal(out)
    // Remove debug prints - use proper logging instead
}`
    return fmt.Sprintf(template, code, testCase, argDecl, problem.FunctionName, callArgs)
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
        case "array":
            decl += fmt.Sprintf("    %s := toIntSlice(%s)\n", arg, idx)
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


