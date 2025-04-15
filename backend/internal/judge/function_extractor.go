package judge

import (
	"errors"
	"regexp"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/logger"
)

type FunctionExtractor struct {
	logger logger.Logger
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
