package service

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

// FunctionSignature represents a parsed function signature
type FunctionSignature struct {
	Name       string   `json:"name"`
	Parameters []string `json:"parameters"`
	ReturnType string   `json:"return_type,omitempty"`
}

// CodeAnalyzer provides regex-based function signature parsing and code analysis
type CodeAnalyzer struct{}

// NewCodeAnalyzer creates a new code analyzer
func NewCodeAnalyzer() *CodeAnalyzer {
	return &CodeAnalyzer{}
}

// ExtractFunctionSignature extracts function signature from code
func (a *CodeAnalyzer) ExtractFunctionSignature(code string, language string) *FunctionSignature {
	switch strings.ToLower(language) {
	case "javascript", "js":
		return a.parseJavaScriptFunction(code)
	case "python", "py":
		return a.parsePythonFunction(code)
	case "go", "golang":
		return a.parseGoFunction(code)
	default:
		return nil
	}
}

// parseJavaScriptFunction parses JavaScript function signature
func (a *CodeAnalyzer) parseJavaScriptFunction(code string) *FunctionSignature {
	// Match function declarations: function name(params) { ... }
	re := regexp.MustCompile(`function\s+(\w+)\s*\(([^)]*)\)`)
	matches := re.FindStringSubmatch(code)
	if len(matches) >= 3 {
		params := a.parseParameters(matches[2])
		return &FunctionSignature{
			Name:       matches[1],
			Parameters: params,
		}
	}

	// Match arrow functions: const name = (params) => { ... }
	reArrow := regexp.MustCompile(`(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>`)
	matchesArrow := reArrow.FindStringSubmatch(code)
	if len(matchesArrow) >= 3 {
		params := a.parseParameters(matchesArrow[2])
		return &FunctionSignature{
			Name:       matchesArrow[1],
			Parameters: params,
		}
	}

	return nil
}

// parsePythonFunction parses Python function signature
func (a *CodeAnalyzer) parsePythonFunction(code string) *FunctionSignature {
	// Match function definitions: def name(params):
	re := regexp.MustCompile(`def\s+(\w+)\s*\(([^)]*)\)\s*:`)
	matches := re.FindStringSubmatch(code)
	if len(matches) >= 3 {
		params := a.parseParameters(matches[2])
		return &FunctionSignature{
			Name:       matches[1],
			Parameters: params,
		}
	}

	return nil
}

// parseGoFunction parses Go function signature
func (a *CodeAnalyzer) parseGoFunction(code string) *FunctionSignature {
	// Match function definitions: func name(params) returnType {
	re := regexp.MustCompile(`func\s+(\w+)\s*\(([^)]*)\)\s*([^{]*)\s*{`)
	matches := re.FindStringSubmatch(code)
	if len(matches) >= 4 {
		params := a.parseParameters(matches[2])
		returnType := strings.TrimSpace(matches[3])
		return &FunctionSignature{
			Name:       matches[1],
			Parameters: params,
			ReturnType: returnType,
		}
	}

	return nil
}

// parseParameters parses parameter list
func (a *CodeAnalyzer) parseParameters(paramStr string) []string {
	if strings.TrimSpace(paramStr) == "" {
		return []string{}
	}

	params := strings.Split(paramStr, ",")
	var result []string
	for _, param := range params {
		param = strings.TrimSpace(param)
		if param != "" {
			result = append(result, param)
		}
	}
	return result
}

// InferParameterTypes infers parameter types based on common patterns
func (a *CodeAnalyzer) InferParameterTypes(code string, signature *FunctionSignature) []string {
	if signature == nil {
		return []string{}
	}

	var types []string
	for _, param := range signature.Parameters {
		paramType := a.inferSingleParameterType(code, param)
		types = append(types, paramType)
	}
	return types
}

// inferSingleParameterType infers type for a single parameter
func (a *CodeAnalyzer) inferSingleParameterType(code string, param string) string {
	// Extract parameter name (remove type annotations)
	paramName := a.extractParameterName(param)

	// Look for usage patterns in the code
	codeLower := strings.ToLower(code)

	// Check for array/list operations
	if strings.Contains(codeLower, paramName+".length") ||
		strings.Contains(codeLower, paramName+".push") ||
		strings.Contains(codeLower, paramName+"[") {
		return "array"
	}

	// Check for string operations
	if strings.Contains(codeLower, paramName+".charat") ||
		strings.Contains(codeLower, paramName+".substring") ||
		strings.Contains(codeLower, paramName+".touppercase") {
		return "string"
	}

	// Check for numeric operations
	if strings.Contains(codeLower, paramName+"-") ||
		strings.Contains(codeLower, paramName+"+") ||
		strings.Contains(codeLower, paramName+"*") ||
		strings.Contains(codeLower, paramName+"/") {
		return "number"
	}

	// Check for boolean operations
	if strings.Contains(codeLower, paramName+"&&") ||
		strings.Contains(codeLower, paramName+"||") ||
		strings.Contains(codeLower, "!"+paramName) {
		return "boolean"
	}

	// Default fallback based on parameter name patterns
	if strings.Contains(strings.ToLower(paramName), "num") ||
		strings.Contains(strings.ToLower(paramName), "count") ||
		strings.Contains(strings.ToLower(paramName), "index") {
		return "number"
	}

	if strings.Contains(strings.ToLower(paramName), "str") ||
		strings.Contains(strings.ToLower(paramName), "text") ||
		strings.Contains(strings.ToLower(paramName), "name") {
		return "string"
	}

	if strings.Contains(strings.ToLower(paramName), "arr") ||
		strings.Contains(strings.ToLower(paramName), "list") ||
		strings.Contains(strings.ToLower(paramName), "nums") {
		return "array"
	}

	// Default to string for unknown types
	return "string"
}

// extractParameterName extracts parameter name from parameter declaration
func (a *CodeAnalyzer) extractParameterName(param string) string {
	// Remove type annotations
	// JavaScript: param: type -> param
	// Python: param: type -> param
	// Go: param type -> param

	// Split by space and take the last part (parameter name)
	parts := strings.Fields(param)
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}
	return param
}

// ParseTestCaseInput parses test case input based on parameter types
func (a *CodeAnalyzer) ParseTestCaseInput(inputJSON string, paramTypes []string) ([]interface{}, error) {
	// Handle empty input
	if strings.TrimSpace(inputJSON) == "" {
		return []interface{}{}, nil
	}

	// First try to parse as array
	var inputArray []interface{}
	if err := json.Unmarshal([]byte(inputJSON), &inputArray); err == nil {
		// Successfully parsed as array
		if len(inputArray) == len(paramTypes) {
			return inputArray, nil
		}
		// If array length doesn't match, try as single value
		if len(inputArray) == 1 && len(paramTypes) == 1 {
			return inputArray, nil
		}
		// If we have more parameters than array elements, pad with nil
		if len(inputArray) < len(paramTypes) {
			padded := make([]interface{}, len(paramTypes))
			copy(padded, inputArray)
			return padded, nil
		}
	}

	// Try to parse as single value
	var singleValue interface{}
	if err := json.Unmarshal([]byte(inputJSON), &singleValue); err == nil {
		// Successfully parsed as single value
		if len(paramTypes) == 1 {
			return []interface{}{singleValue}, nil
		}
		// If we have multiple parameters but single value, pad with nil
		padded := make([]interface{}, len(paramTypes))
		padded[0] = singleValue
		return padded, nil
	}

	return nil, fmt.Errorf("failed to parse test case input: %s", inputJSON)
}
