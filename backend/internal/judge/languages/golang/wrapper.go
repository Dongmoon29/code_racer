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
	// Parse user imports
	importParser := parser.NewImportParser()
	importInfo := importParser.ParseImports(code, 60) // Go language ID

	// Build imports section with duplicate removal
	baseImports := []string{`"encoding/json"`, `"fmt"`, `"os"`}
	allImports := make([]string, 0, len(baseImports)+len(importInfo.Imports))

	// Add base imports
	allImports = append(allImports, baseImports...)

	// Add user imports and remove duplicates
	importSet := make(map[string]bool)
	for _, imp := range baseImports {
		importSet[imp] = true
	}

	for _, imp := range importInfo.Imports {
		// Remove "import " prefix if present for multi-line imports
		if after, ok := strings.CutPrefix(imp, "import "); ok {
			imp = after
		}
		// Add quotes if not present
		if !strings.HasPrefix(imp, `"`) {
			imp = `"` + imp + `"`
		}
		// Check for duplicates
		if !importSet[imp] {
			allImports = append(allImports, imp)
			importSet[imp] = true
		}
	}

	// Build final imports section
	importsSection := `import (
    "encoding/json"
    "fmt"
    "os"
)`
	if len(allImports) > len(baseImports) {
		importsSection = `import (`
		for _, imp := range allImports {
			importsSection += "\n    " + imp
		}
		importsSection += "\n)"
	}

	// Try to infer parameter types from function signature if IOSchema is empty
	var paramTypes []string
	if problem.IOSchema.ParamTypes != "" {
		// Parse JSON string to []string
		if err := json.Unmarshal([]byte(problem.IOSchema.ParamTypes), &paramTypes); err != nil {
			// Fallback to empty slice if parsing fails
			paramTypes = []string{}
		}
	}
	if len(paramTypes) == 0 {
		sigParser := parser.NewGoSignatureParser()
		inferredTypes := sigParser.InferParamTypesFromSignature(code, problem.FunctionName)
		if len(inferredTypes) > 0 {
			paramTypes = inferredTypes
		}
	}

	if len(paramTypes) == 0 {
		// Fallback: assume all parameters are arrays for backward compatibility
		template := `package main

%s

// user code
%s

func toInt(v interface{}) int { if f, ok := v.(float64); ok { return int(f) }; if i, ok := v.(int); ok { return i }; return 0 }
func toIntSlice(v interface{}) []int { arr, ok := v.([]interface{}); if !ok { return nil }; out := make([]int,0,len(arr)); for _, it := range arr { out = append(out, toInt(it)) }; return out }

func main() {
    var cases [][]interface{}
    if err := json.Unmarshal([]byte(%q), &cases); err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing cases: %%v\n", err)
        os.Exit(1)
    }
    results := make([]interface{}, 0, len(cases))
    for _, c := range cases {
        arg0 := toIntSlice(c[0])
        arg1 := toIntSlice(c[1])
        out := %s(arg0, arg1)
        results = append(results, out)
    }
    b, _ := json.Marshal(results)
    fmt.Print(string(b))
}`
		return fmt.Sprintf(template, importsSection, importInfo.Code, testCasesJSON, problem.FunctionName), nil
	}

	argDecl, callArgs := goArgLines("c", paramTypes)
	template := `package main

%s

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
	return fmt.Sprintf(template, importsSection, importInfo.Code, testCasesJSON, argDecl, problem.FunctionName, callArgs), nil
}

func (g *Wrapper) WrapSingle(code string, testCase string, problem *model.Problem) string {
	// Parse user imports
	importParser := parser.NewImportParser()
	importInfo := importParser.ParseImports(code, 60) // Go language ID

	// Build imports section with duplicate removal
	baseImports := []string{`"encoding/json"`, `"fmt"`, `"os"`}
	allImports := make([]string, 0, len(baseImports)+len(importInfo.Imports))

	// Add base imports
	allImports = append(allImports, baseImports...)

	// Add user imports and remove duplicates
	importSet := make(map[string]bool)
	for _, imp := range baseImports {
		importSet[imp] = true
	}

	for _, imp := range importInfo.Imports {
		// Remove "import " prefix if present for multi-line imports
		if strings.HasPrefix(imp, "import ") {
			imp = strings.TrimPrefix(imp, "import ")
		}
		// Add quotes if not present
		if !strings.HasPrefix(imp, `"`) {
			imp = `"` + imp + `"`
		}
		// Check for duplicates
		if !importSet[imp] {
			allImports = append(allImports, imp)
			importSet[imp] = true
		}
	}

	// Build final imports section
	importsSection := `import (
    "encoding/json"
    "fmt"
    "os"
)`
	if len(allImports) > len(baseImports) {
		importsSection = `import (`
		for _, imp := range allImports {
			importsSection += "\n    " + imp
		}
		importsSection += "\n)"
	}

	// Try to infer parameter types from function signature if IOSchema is empty
	var paramTypes []string
	if problem.IOSchema.ParamTypes != "" {
		// Parse JSON string to []string
		if err := json.Unmarshal([]byte(problem.IOSchema.ParamTypes), &paramTypes); err != nil {
			// Fallback to empty slice if parsing fails
			paramTypes = []string{}
		}
	}
	if len(paramTypes) == 0 {
		sigParser := parser.NewGoSignatureParser()
		inferredTypes := sigParser.InferParamTypesFromSignature(code, problem.FunctionName)
		if len(inferredTypes) > 0 {
			paramTypes = inferredTypes
		}
	}

	if len(paramTypes) == 0 {
		// Fallback: try to infer parameter count from function signature
		sigParser := parser.NewGoSignatureParser()
		inferredTypes := sigParser.InferParamTypesFromSignature(code, problem.FunctionName)
		if len(inferredTypes) > 0 {
			paramTypes = inferredTypes
		}
	}

	if len(paramTypes) == 0 {
		// Ultimate fallback: assume single int parameter for common cases
		paramTypes = []string{"int"}
	}

	argDecl, callArgs := goArgLines("testCase", paramTypes)
	template := `package main

%s

// user code
%s

func toInt(v interface{}) int { if f, ok := v.(float64); ok { return int(f) }; if i, ok := v.(int); ok { return i }; return 0 }
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
    fmt.Print(string(b))
}`
	return fmt.Sprintf(template, importsSection, importInfo.Code, testCase, argDecl, problem.FunctionName, callArgs)
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
