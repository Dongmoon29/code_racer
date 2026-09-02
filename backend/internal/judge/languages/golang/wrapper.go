package golang

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"path"
	"regexp"
	"sort"
	"strconv"
	"strings"

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

func (g *Wrapper) WrapSingle(code string, testCase string, problem *model.Problem) (string, error) {
	// LeetCode-style single runner: user submits a function; runner reads stdin JSON and calls it.
	cleanedCode, userImports, err := normalizeGoSubmission(code)
	if err != nil {
		return "", err
	}

	// Determine param types from IOSchema (required).
	paramTypes := []string{}
	if problem != nil {
		paramTypes = problem.IOSchema.ParamTypes
	}
	if len(paramTypes) == 0 {
		return "", fmt.Errorf("missing or invalid io_schema.param_types")
	}

	importBlock, refs, err := buildGoImportBlock(userImports)
	if err != nil {
		return "", err
	}
	unmarshalDecl, callArgs, ok := buildGoArgUnmarshal(paramTypes, refs)
	if !ok {
		return "", fmt.Errorf("unsupported Go parameter schema: %v", paramTypes)
	}

	template := `package main

import (
%s
)

// ===== User code (preserved as-is) =====
%s
// ====================================

func main() {
	data, err := %[3]s.ReadAll(%[4]s.Stdin)
	if err != nil {
		%[5]s.Fprint(%[4]s.Stderr, "failed to read input")
		%[4]s.Exit(1)
	}
	raw := %[6]s.TrimSpace(string(data))
	if raw == "" {
		return
	}

%[7]s
	result := %[8]s(%[9]s)
	out, err := %[10]s.Marshal(result)
	if err != nil {
		%[5]s.Fprint(%[4]s.Stderr, "failed to encode output")
		%[4]s.Exit(1)
	}
	%[5]s.Print(string(out))
}`
	return fmt.Sprintf(template, importBlock, cleanedCode, refs["io/ioutil"], refs["os"], refs["fmt"], refs["strings"], unmarshalDecl, problem.FunctionName, callArgs, refs["encoding/json"]), nil
}

type goImport struct {
	alias string
	path  string
}

// normalizeGoSubmission uses Go's parser to remove only the package and import
// declarations. Function bodies, helpers, comments and identifiers are not
// rewritten or guessed from line contents.
func normalizeGoSubmission(code string) (string, []goImport, error) {
	source := strings.TrimSpace(code)
	if source == "" {
		return "", nil, fmt.Errorf("code cannot be empty")
	}
	if !regexpPackageDeclaration.MatchString(source) {
		source = "package main\n\n" + source
	}

	fset := token.NewFileSet()
	file, err := parser.ParseFile(fset, "submission.go", source, parser.ParseComments)
	if err != nil {
		return "", nil, fmt.Errorf("invalid Go source: %w", err)
	}

	type span struct{ start, end int }
	spans := []span{{
		start: fset.Position(file.Package).Offset,
		end:   fset.Position(file.Name.End()).Offset,
	}}
	imports := make([]goImport, 0, len(file.Imports))
	for _, decl := range file.Decls {
		gen, ok := decl.(*ast.GenDecl)
		if !ok || gen.Tok != token.IMPORT {
			continue
		}
		spans = append(spans, span{
			start: fset.Position(gen.Pos()).Offset,
			end:   fset.Position(gen.End()).Offset,
		})
		for _, spec := range gen.Specs {
			imp := spec.(*ast.ImportSpec)
			importPath, unquoteErr := strconv.Unquote(imp.Path.Value)
			if unquoteErr != nil {
				return "", nil, fmt.Errorf("invalid Go import %s", imp.Path.Value)
			}
			alias := ""
			if imp.Name != nil {
				alias = imp.Name.Name
			}
			imports = append(imports, goImport{alias: alias, path: importPath})
		}
	}
	for _, decl := range file.Decls {
		if fn, ok := decl.(*ast.FuncDecl); ok && fn.Name.Name == "main" {
			return "", nil, fmt.Errorf("submit only the requested function; func main is not allowed")
		}
	}

	// Blank parsed declarations from the original source, preserving every other byte.
	bytes := []byte(source)
	for _, span := range spans {
		for i := span.start; i < span.end; i++ {
			if bytes[i] != '\n' && bytes[i] != '\r' {
				bytes[i] = ' '
			}
		}
	}
	return strings.TrimSpace(string(bytes)), imports, nil
}

var regexpPackageDeclaration = regexp.MustCompile(`(?m)^\s*package\s+[A-Za-z_][A-Za-z0-9_]*`)

func buildGoImportBlock(userImports []goImport) (string, map[string]string, error) {
	// Judge0 language ID 60 currently runs Go 1.13, so use io/ioutil
	// instead of io.ReadAll (introduced in Go 1.16).
	required := []string{"encoding/json", "fmt", "io/ioutil", "os", "strings"}
	byPath := make(map[string]goImport, len(userImports)+len(required))
	for _, imp := range userImports {
		if _, exists := byPath[imp.path]; exists {
			return "", nil, fmt.Errorf("duplicate Go import %q", imp.path)
		}
		byPath[imp.path] = imp
	}
	refs := make(map[string]string, len(required))
	for _, importPath := range required {
		imp, exists := byPath[importPath]
		if !exists {
			imp = goImport{path: importPath}
			byPath[importPath] = imp
		}
		if imp.alias == "." || imp.alias == "_" {
			return "", nil, fmt.Errorf("Go import %q cannot use alias %q because it is required by the runner", importPath, imp.alias)
		}
		if imp.alias != "" {
			refs[importPath] = imp.alias
		} else {
			refs[importPath] = path.Base(importPath)
		}
	}
	all := make([]goImport, 0, len(byPath))
	for _, imp := range byPath {
		all = append(all, imp)
	}
	sort.Slice(all, func(i, j int) bool { return all[i].path < all[j].path })
	lines := make([]string, 0, len(all))
	for _, imp := range all {
		prefix := ""
		if imp.alias != "" {
			prefix = imp.alias + " "
		}
		lines = append(lines, fmt.Sprintf("\t%s%q", prefix, imp.path))
	}
	return strings.Join(lines, "\n"), refs, nil
}

func goTypeFromSchema(t string) (string, bool) {
	t = strings.TrimSpace(t)
	switch t {
	case "int", "number":
		return "int", true
	case "float", "float64":
		return "float64", true
	case "int64":
		return "int64", true
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
	case "float[]", "float64[]", "[]float64":
		return "[]float64", true
	case "bool[]", "boolean[]", "[]bool":
		return "[]bool", true
	case "string[][]", "[][]string":
		return "[][]string", true
	default:
		return "", false
	}
}

func buildGoArgUnmarshal(paramTypes []string, refs map[string]string) (decl string, call string, ok bool) {
	jsonRef := refs["encoding/json"]
	fmtRef := refs["fmt"]
	osRef := refs["os"]
	decl += fmt.Sprintf("\tvar args []%s.RawMessage\n", jsonRef)
	decl += fmt.Sprintf("\tif err := %s.Unmarshal([]byte(raw), &args); err != nil {\n", jsonRef)
	decl += fmt.Sprintf("\t\t%s.Fprint(%s.Stderr, \"invalid input\")\n", fmtRef, osRef)
	decl += fmt.Sprintf("\t\t%s.Exit(1)\n", osRef)
	decl += "\t}\n"
	decl += fmt.Sprintf("\tif len(args) != %d {\n", len(paramTypes))
	decl += fmt.Sprintf("\t\t%s.Fprint(%s.Stderr, \"invalid input\")\n", fmtRef, osRef)
	decl += fmt.Sprintf("\t\t%s.Exit(1)\n", osRef)
	decl += "\t}\n\n"

	for i, pt := range paramTypes {
		goType, ok2 := goTypeFromSchema(pt)
		if !ok2 {
			return "", "", false
		}
		decl += fmt.Sprintf("\tvar arg%d %s\n", i, goType)
		decl += fmt.Sprintf("\tif err := %s.Unmarshal(args[%d], &arg%d); err != nil {\n", jsonRef, i, i)
		decl += fmt.Sprintf("\t\t%s.Fprint(%s.Stderr, \"invalid input\")\n", fmtRef, osRef)
		decl += fmt.Sprintf("\t\t%s.Exit(1)\n", osRef)
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
