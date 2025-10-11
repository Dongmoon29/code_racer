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

// CodeWrapper is an improved service that handles code wrapping for each programming language
type CodeWrapper struct {
	logger       logger.Logger
	langWrappers map[int]languages.LanguageWrapper
	validators   map[int]CodeValidator
}

// CodeValidator is responsible for code validation
type CodeValidator interface {
	Validate(code string, problem *model.Problem) error
	ExtractFunctionName(code string) (string, error)
}

// DefaultCodeValidator provides a default code validator
type DefaultCodeValidator struct{}

func (v *DefaultCodeValidator) Validate(code string, problem *model.Problem) error {
	if strings.TrimSpace(code) == "" {
		return fmt.Errorf("code cannot be empty")
	}
	if problem.FunctionName == "" {
		return fmt.Errorf("function name is required")
	}
	return nil
}

func (v *DefaultCodeValidator) ExtractFunctionName(code string) (string, error) {
	// Default implementation: simple function name extraction
	lines := strings.Split(code, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.Contains(line, "function ") || strings.Contains(line, "def ") || strings.Contains(line, "func ") {
			// Simple extraction logic
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

// WrapCode wraps the given code into test code suitable for the language (improved version)
func (w *CodeWrapper) WrapCode(code string, languageID int, testCase string, problem *model.Problem) (string, error) {
	w.logger.Info().
		Int("languageID", languageID).
		Str("testCase", testCase).
		Str("functionName", problem.FunctionName).
		Msg("Wrapping code for testing")

	// Code validation
	if validator, ok := w.validators[languageID]; ok {
		if err := validator.Validate(code, problem); err != nil {
			return "", fmt.Errorf("code validation failed: %w", err)
		}
	}

	// Test case validation
	if err := w.validateTestCase(testCase); err != nil {
		return "", fmt.Errorf("test case validation failed: %w", err)
	}

	// Execute language-specific wrapping
	if impl, ok := w.langWrappers[languageID]; ok {
		wrappedCode := impl.WrapSingle(code, testCase, problem)
		if wrappedCode == "" {
			return "", fmt.Errorf("failed to wrap code for language ID: %d", languageID)
		}
		return wrappedCode, nil
	}

	// No fallback needed - all languages should be implemented in langWrappers
	return "", fmt.Errorf("unsupported programming language ID: %d", languageID)
}

// validateTestCase validates the test case JSON
func (w *CodeWrapper) validateTestCase(testCase string) error {
	if strings.TrimSpace(testCase) == "" {
		return fmt.Errorf("test case cannot be empty")
	}

	// JSON validation
	var testData interface{}
	if err := json.Unmarshal([]byte(testCase), &testData); err != nil {
		return fmt.Errorf("invalid test case JSON: %w", err)
	}

	return nil
}

// WrapCodeBatch creates a batch harness that runs all test cases at once (improved version)
func (w *CodeWrapper) WrapCodeBatch(code string, languageID int, testCasesJSON string, problem *model.Problem) (string, error) {
	w.logger.Info().
		Int("languageID", languageID).
		Str("functionName", problem.FunctionName).
		Msg("Wrapping code for batch testing")

	// Code validation
	if validator, ok := w.validators[languageID]; ok {
		if err := validator.Validate(code, problem); err != nil {
			return "", fmt.Errorf("code validation failed: %w", err)
		}
	}

	// Batch test case validation
	if err := w.validateBatchTestCases(testCasesJSON); err != nil {
		return "", fmt.Errorf("batch test cases validation failed: %w", err)
	}

	// Execute language-specific batch wrapping
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

	// JSON validation
	var testData interface{}
	if err := json.Unmarshal([]byte(testCasesJSON), &testData); err != nil {
		return fmt.Errorf("invalid batch test cases JSON: %w", err)
	}

	// Check if it's an array
	if _, ok := testData.([]interface{}); !ok {
		return fmt.Errorf("batch test cases must be an array")
	}

	return nil
}
