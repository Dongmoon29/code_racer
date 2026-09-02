package judge

import (
	"errors"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"regexp"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/logger"
)

type FunctionExtractor struct {
	logger logger.Logger
}

// ValidateExpectedFunction verifies that the requested entry function exists.
// It deliberately does not assume that the first function in a submission is
// the solution: users are allowed to define helpers before it.
func (e *FunctionExtractor) ValidateExpectedFunction(code, language, expected string) error {
	if strings.TrimSpace(expected) == "" {
		return errors.New("expected function name is empty")
	}
	var found bool
	switch strings.ToLower(language) {
	case "go":
		source := code
		if !regexp.MustCompile(`(?m)^\s*package\s+\w+`).MatchString(source) {
			source = "package main\n" + source
		}
		file, err := parser.ParseFile(token.NewFileSet(), "submission.go", source, 0)
		if err != nil {
			return fmt.Errorf("invalid Go source: %w", err)
		}
		for _, decl := range file.Decls {
			if fn, ok := decl.(*ast.FuncDecl); ok && fn.Recv == nil && fn.Name.Name == expected {
				found = true
				break
			}
		}
	case "python":
		pattern := `(?m)^(?:async\s+)?def\s+` + regexp.QuoteMeta(expected) + `\s*\(`
		found = regexp.MustCompile(pattern).MatchString(code)
	case "javascript":
		name := regexp.QuoteMeta(expected)
		patterns := []string{
			`(?m)\bfunction\s+` + name + `\s*\(`,
			`(?m)\b(?:const|let|var)\s+` + name + `\s*=\s*(?:function\s*\(|(?:async\s*)?\([^)]*\)\s*=>|(?:async\s+)?[A-Za-z_$][\w$]*\s*=>)`,
		}
		for _, pattern := range patterns {
			if regexp.MustCompile(pattern).MatchString(code) {
				found = true
				break
			}
		}
	case "java", "cpp":
		found = regexp.MustCompile(`\b` + regexp.QuoteMeta(expected) + `\s*\(`).MatchString(code)
	default:
		return fmt.Errorf("unsupported language: %s", language)
	}
	if !found {
		return fmt.Errorf("required function %q was not found", expected)
	}
	return nil
}

func NewFunctionExtractor(logger logger.Logger) *FunctionExtractor {
	return &FunctionExtractor{logger: logger}
}

func (e *FunctionExtractor) ExtractFunctionName(code, language string) (string, error) {
	switch strings.ToLower(language) {
	case "javascript":
		return e.extractJavaScriptFunction(code)
	case "python":
		return e.extractPythonFunction(code)
	case "go":
		return e.extractGoFunction(code)
	case "java":
		return e.extractJavaMethod(code)
	case "cpp":
		return e.extractCPPMethod(code)
	default:
		return "", errors.New("unsupported language")
	}
}

func (e *FunctionExtractor) extractJavaScriptFunction(code string) (string, error) {
	// function name() 또는 const/let/var name = function() 패턴 매칭
	patterns := []string{
		`function\s+(\w+)\s*\(`,                         // 일반 함수
		`(?:const|let|var)\s+(\w+)\s*=\s*function\s*\(`, // 함수 표현식
		`(?:const|let|var)\s+(\w+)\s*=\s*\(.*\)\s*=>`,   // 화살표 함수
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		if matches := re.FindStringSubmatch(code); len(matches) > 1 {
			return matches[1], nil
		}
	}

	return "", errors.New("no function definition found")
}

func (e *FunctionExtractor) extractPythonFunction(code string) (string, error) {
	// def function_name( 패턴 매칭
	re := regexp.MustCompile(`def\s+(\w+)\s*\(`)
	if matches := re.FindStringSubmatch(code); len(matches) > 1 {
		return matches[1], nil
	}
	return "", errors.New("no function definition found")
}

func (e *FunctionExtractor) extractGoFunction(code string) (string, error) {
	// func name( 패턴 매칭
	re := regexp.MustCompile(`func\s+(\w+)\s*\(`)
	if matches := re.FindStringSubmatch(code); len(matches) > 1 {
		return matches[1], nil
	}
	return "", errors.New("no function definition found")
}

func (e *FunctionExtractor) extractJavaMethod(code string) (string, error) {
	// public/private/protected return_type name( 패턴 매칭
	re := regexp.MustCompile(`(?:public|private|protected)?\s+(?:\w+)\s+(\w+)\s*\(`)
	if matches := re.FindStringSubmatch(code); len(matches) > 1 {
		return matches[1], nil
	}
	return "", errors.New("no method definition found")
}

func (e *FunctionExtractor) extractCPPMethod(code string) (string, error) {
	// return_type Solution::name( 또는 return_type name( 패턴 매칭
	patterns := []string{
		`(?:\w+)\s+Solution::(\w+)\s*\(`, // 클래스 메서드
		`(?:\w+)\s+(\w+)\s*\(`,           // 일반 함수
	}

	for _, pattern := range patterns {
		re := regexp.MustCompile(pattern)
		if matches := re.FindStringSubmatch(code); len(matches) > 1 {
			return matches[1], nil
		}
	}

	return "", errors.New("no function/method definition found")
}
