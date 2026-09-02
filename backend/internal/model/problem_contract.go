package model

import (
	"encoding/json"
	"fmt"
	"io"
	"regexp"
	"strings"
)

var functionNamePattern = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_]*$`)

func normalizeSchemaType(value string) string {
	switch strings.TrimSpace(strings.ToLower(value)) {
	case "number":
		return "int"
	case "boolean":
		return "bool"
	case "[]int", "array":
		return "int[]"
	case "[][]int":
		return "int[][]"
	case "[]string":
		return "string[]"
	case "[]float64", "float[]":
		return "float64[]"
	case "[]bool", "boolean[]":
		return "bool[]"
	case "[][]string":
		return "string[][]"
	default:
		return strings.TrimSpace(strings.ToLower(value))
	}
}

func IsSupportedSchemaType(value string) bool {
	switch normalizeSchemaType(value) {
	case "int", "int64", "float64", "bool", "string", "int[]", "int[][]", "string[]", "string[][]", "float64[]", "bool[]":
		return true
	default:
		return false
	}
}

func ValidateFunctionContract(functionName string, paramTypes []string, returnType string) error {
	if !functionNamePattern.MatchString(strings.TrimSpace(functionName)) {
		return fmt.Errorf("invalid function name")
	}
	if len(paramTypes) == 0 {
		return fmt.Errorf("at least one parameter type is required")
	}
	for _, value := range paramTypes {
		if !IsSupportedSchemaType(value) {
			return fmt.Errorf("unsupported parameter type %q", value)
		}
	}
	if !IsSupportedSchemaType(returnType) {
		return fmt.Errorf("unsupported return type %q", returnType)
	}
	return nil
}

// NormalizeFunctionContract returns the canonical schema representation that
// is persisted and exposed by the API.
func NormalizeFunctionContract(functionName string, paramTypes []string, returnType string) ([]string, string, error) {
	if err := ValidateFunctionContract(functionName, paramTypes, returnType); err != nil {
		return nil, "", err
	}
	normalizedParams := make([]string, len(paramTypes))
	for i, value := range paramTypes {
		normalizedParams[i] = normalizeSchemaType(value)
	}
	return normalizedParams, normalizeSchemaType(returnType), nil
}

// ValidateJSONValue verifies that a JSON value conforms to the deliberately
// small type vocabulary supported by all three language adapters.
func ValidateJSONValue(raw json.RawMessage, schemaType string) error {
	var value any
	decoder := json.NewDecoder(strings.NewReader(string(raw)))
	decoder.UseNumber()
	if err := decoder.Decode(&value); err != nil {
		return fmt.Errorf("invalid JSON: %w", err)
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		return fmt.Errorf("invalid JSON: multiple values")
	}
	return validateDecodedValue(value, normalizeSchemaType(schemaType))
}

func validateDecodedValue(value any, schemaType string) error {
	switch schemaType {
	case "int", "int64":
		number, ok := value.(json.Number)
		if !ok {
			return fmt.Errorf("expected %s", schemaType)
		}
		if _, err := number.Int64(); err != nil {
			return fmt.Errorf("expected %s", schemaType)
		}
		return nil
	case "float64":
		if _, ok := value.(json.Number); !ok {
			return fmt.Errorf("expected float64")
		}
		return nil
	case "bool":
		if _, ok := value.(bool); !ok {
			return fmt.Errorf("expected bool")
		}
		return nil
	case "string":
		if _, ok := value.(string); !ok {
			return fmt.Errorf("expected string")
		}
		return nil
	case "int[]", "int[][]", "string[]", "string[][]", "float64[]", "bool[]":
		items, ok := value.([]any)
		if !ok {
			return fmt.Errorf("expected %s", schemaType)
		}
		elementType := strings.TrimSuffix(schemaType, "[]")
		for index, item := range items {
			if err := validateDecodedValue(item, elementType); err != nil {
				return fmt.Errorf("element %d: %w", index, err)
			}
		}
		return nil
	default:
		return fmt.Errorf("unsupported schema type %q", schemaType)
	}
}

func GenerateStarterTemplates(functionName string, paramTypes []string, returnType string) []StarterTemplate {
	if err := ValidateFunctionContract(functionName, paramTypes, returnType); err != nil {
		return []StarterTemplate{}
	}

	paramNames := make([]string, len(paramTypes))
	for i := range paramNames {
		paramNames[i] = fmt.Sprintf("arg%d", i)
	}

	return []StarterTemplate{
		{Language: "javascript", Code: javascriptStarter(functionName, paramNames)},
		{Language: "python", Code: pythonStarter(functionName, paramNames, paramTypes, returnType)},
		{Language: "go", Code: goStarter(functionName, paramNames, paramTypes, returnType)},
	}
}

func javascriptStarter(functionName string, params []string) string {
	return fmt.Sprintf("function %s(%s) {\n  // Write your solution here.\n}\n", functionName, strings.Join(params, ", "))
}

func pythonStarter(functionName string, names, types []string, returnType string) string {
	params := make([]string, len(names))
	for i := range names {
		params[i] = fmt.Sprintf("%s: %s", names[i], pythonType(types[i]))
	}
	return fmt.Sprintf("from typing import List\n\ndef %s(%s) -> %s:\n    # Write your solution here.\n    pass\n", functionName, strings.Join(params, ", "), pythonType(returnType))
}

func pythonType(value string) string {
	switch normalizeSchemaType(value) {
	case "int", "int64":
		return "int"
	case "float64":
		return "float"
	case "bool":
		return "bool"
	case "string":
		return "str"
	case "int[]":
		return "List[int]"
	case "int[][]":
		return "List[List[int]]"
	case "string[]":
		return "List[str]"
	case "string[][]":
		return "List[List[str]]"
	case "float64[]":
		return "List[float]"
	case "bool[]":
		return "List[bool]"
	default:
		return "object"
	}
}

func goStarter(functionName string, names, types []string, returnType string) string {
	params := make([]string, len(names))
	for i := range names {
		params[i] = fmt.Sprintf("%s %s", names[i], goSchemaType(types[i]))
	}
	return fmt.Sprintf("func %s(%s) %s {\n\t// Write your solution here.\n\treturn %s\n}\n", functionName, strings.Join(params, ", "), goSchemaType(returnType), goZeroValue(returnType))
}

func goSchemaType(value string) string {
	switch normalizeSchemaType(value) {
	case "int":
		return "int"
	case "int64":
		return "int64"
	case "float64":
		return "float64"
	case "bool":
		return "bool"
	case "string":
		return "string"
	case "int[]":
		return "[]int"
	case "int[][]":
		return "[][]int"
	case "string[]":
		return "[]string"
	case "string[][]":
		return "[][]string"
	case "float64[]":
		return "[]float64"
	case "bool[]":
		return "[]bool"
	default:
		return "interface{}"
	}
}

func goZeroValue(value string) string {
	switch normalizeSchemaType(value) {
	case "int", "int64", "float64":
		return "0"
	case "bool":
		return "false"
	case "string":
		return `""`
	default:
		return "nil"
	}
}
