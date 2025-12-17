package golang

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/judge/parser"
	"github.com/Dongmoon29/code_racer/internal/model"
)

// Wrapper implements Go-specific code wrapping logic.
type Wrapper struct{}

func NewWrapper() *Wrapper { return &Wrapper{} }

func (g *Wrapper) WrapBatch(code string, testCasesJSON string, problem *model.Problem) (string, error) {
	// LeetCode-style MVP: prefer per-test execution; batch harness is optional.
	// Keeping this unimplemented avoids maintaining two runners.
	return "", fmt.Errorf("batch wrapper not supported for Go in LeetCode mode")
}

func (g *Wrapper) WrapSingle(code string, testCase string, problem *model.Problem) string {
	// LeetCode-style single runner: user submits a function; runner reads stdin JSON and calls it.

	userCode := strings.TrimSpace(code)

	// Extract imports and code, and remove package/main from user code.
	ip := parser.NewImportParser()
	info := ip.ParseImports(userCode, 60)
	cleanedCode := stripGoPackageLine(info.Code)

	// Determine param types from IOSchema (required).
	paramTypes := []string{}
	if problem != nil && strings.TrimSpace(problem.IOSchema.ParamTypes) != "" {
		_ = json.Unmarshal([]byte(problem.IOSchema.ParamTypes), &paramTypes)
	}
	if len(paramTypes) == 0 {
		// IOSchema is required; judge service should reject missing schema before wrapping.
		return ""
	}

	importBlock := buildGoImportBlock(info.Imports)
	unmarshalDecl, callArgs, ok := buildGoArgUnmarshal(paramTypes)
	if !ok {
		return ""
	}

	template := `package main

import (
%s
)

// ===== User code (preserved as-is) =====
%s
// ====================================

func main() {
	data, _ := ioutil.ReadAll(os.Stdin)
	raw := strings.TrimSpace(string(data))
	if raw == "" {
		return
	}

%s
	result := %s(%s)
	out, _ := json.Marshal(result)
	fmt.Print(string(out))
}`
	return fmt.Sprintf(template, importBlock, cleanedCode, unmarshalDecl, problem.FunctionName, callArgs)
}

func stripGoPackageLine(code string) string {
	lines := strings.Split(code, "\n")
	out := make([]string, 0, len(lines))
	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "package ") {
			continue
		}
		out = append(out, line)
	}
	return strings.TrimSpace(strings.Join(out, "\n"))
}

func normalizeGoImport(s string) string {
	trimmed := strings.TrimSpace(s)
	if strings.HasPrefix(trimmed, "import ") {
		trimmed = strings.TrimSpace(strings.TrimPrefix(trimmed, "import "))
	}
	trimmed = strings.Trim(trimmed, "()")
	trimmed = strings.TrimSpace(trimmed)
	if trimmed == "" {
		return ""
	}
	// Ensure quoted form for import block
	if strings.HasPrefix(trimmed, `"`) {
		return trimmed
	}
	// Handle alias imports like: foo "bar"
	parts := strings.Fields(trimmed)
	if len(parts) == 2 && strings.HasPrefix(parts[1], `"`) {
		return parts[0] + " " + parts[1]
	}
	return `"` + strings.Trim(trimmed, `"`) + `"`
}

func buildGoImportBlock(userImports []string) string {
	// Required for runner
	required := []string{`"encoding/json"`, `"fmt"`, `"io/ioutil"`, `"os"`, `"strings"`}
	set := map[string]struct{}{}
	for _, r := range required {
		set[r] = struct{}{}
	}
	for _, imp := range userImports {
		n := normalizeGoImport(imp)
		if n == "" {
			continue
		}
		set[n] = struct{}{}
	}
	all := make([]string, 0, len(set))
	for k := range set {
		all = append(all, k)
	}
	sort.Strings(all)
	lines := make([]string, 0, len(all))
	for _, imp := range all {
		lines = append(lines, "\t"+imp)
	}
	return strings.Join(lines, "\n")
}

func goTypeFromSchema(t string) (string, bool) {
	t = strings.TrimSpace(t)
	switch t {
	case "int", "number":
		return "int", true
	case "float", "float64":
		return "float64", true
	case "bool", "boolean":
		return "bool", true
	case "string":
		return "string", true
	case "int[]", "[]int", "array":
		return "[]int", true
	case "int[][]", "[][]int":
		return "[][]int", true
	case "string[]", "[]string":
		return "[]string", true
	default:
		return "", false
	}
}

func buildGoArgUnmarshal(paramTypes []string) (decl string, call string, ok bool) {
	// Single param: stdin is a JSON value
	if len(paramTypes) == 1 {
		goType, ok2 := goTypeFromSchema(paramTypes[0])
		if !ok2 {
			return "", "", false
		}
		decl += fmt.Sprintf("\tvar arg0 %s\n", goType)
		decl += "\tif err := json.Unmarshal([]byte(raw), &arg0); err != nil {\n"
		decl += "\t\tfmt.Fprint(os.Stderr, \"invalid input\")\n"
		decl += "\t\tos.Exit(1)\n"
		decl += "\t}\n"
		return decl, "arg0", true
	}

	decl += "\tvar args []json.RawMessage\n"
	decl += "\tif err := json.Unmarshal([]byte(raw), &args); err != nil {\n"
	decl += "\t\tfmt.Fprint(os.Stderr, \"invalid input\")\n"
	decl += "\t\tos.Exit(1)\n"
	decl += "\t}\n"
	decl += fmt.Sprintf("\tif len(args) != %d {\n", len(paramTypes))
	decl += "\t\tfmt.Fprint(os.Stderr, \"invalid input\")\n"
	decl += "\t\tos.Exit(1)\n"
	decl += "\t}\n\n"

	for i, pt := range paramTypes {
		goType, ok2 := goTypeFromSchema(pt)
		if !ok2 {
			return "", "", false
		}
		decl += fmt.Sprintf("\tvar arg%d %s\n", i, goType)
		decl += fmt.Sprintf("\tif err := json.Unmarshal(args[%d], &arg%d); err != nil {\n", i, i)
		decl += "\t\tfmt.Fprint(os.Stderr, \"invalid input\")\n"
		decl += "\t\tos.Exit(1)\n"
		decl += "\t}\n"
		if i < len(paramTypes)-1 {
			decl += "\n"
		}
		if i > 0 {
			call += ", "
		}
		call += fmt.Sprintf("arg%d", i)
	}
	return decl, call, true
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
