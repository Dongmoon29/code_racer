package parser

import (
	"regexp"
	"strings"
)

// JavaScriptParser uses regex-based approach for reliable parsing
type JavaScriptParser struct{}

func NewJavaScriptParser() *JavaScriptParser {
	return &JavaScriptParser{}
}

// ParseResult contains the parsed components of JavaScript code
type ParseResult struct {
	Imports   []string
	Functions []string
	OtherCode []string
	MainCode  []string
}

// ParseJavaScript performs structural parsing using regex patterns
func (p *JavaScriptParser) ParseJavaScript(code string) *ParseResult {
	lines := strings.Split(code, "\n")

	result := &ParseResult{
		Imports:   make([]string, 0),
		Functions: make([]string, 0),
		OtherCode: make([]string, 0),
		MainCode:  make([]string, 0),
	}

	var currentFunction []string
	var currentMain []string
	inFunction := false
	inMain := false
	braceCount := 0

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Skip empty lines
		if trimmed == "" {
			if inFunction {
				currentFunction = append(currentFunction, line)
			} else if inMain {
				currentMain = append(currentMain, line)
			} else {
				result.OtherCode = append(result.OtherCode, line)
			}
			continue
		}

		// Parse imports
		if p.isImportStatement(trimmed) {
			result.Imports = append(result.Imports, line)
			continue
		}

		// Detect function declarations
		if p.isFunctionDeclaration(trimmed) {
			// Save previous function if exists
			if len(currentFunction) > 0 {
				result.Functions = append(result.Functions, strings.Join(currentFunction, "\n"))
				currentFunction = nil
			}

			// Start new function
			inFunction = true
			braceCount = 0
			currentFunction = append(currentFunction, line)
			continue
		}

		// Detect main function or test code
		if p.isMainOrTestCode(trimmed) {
			// Save previous function if exists
			if len(currentFunction) > 0 {
				result.Functions = append(result.Functions, strings.Join(currentFunction, "\n"))
				currentFunction = nil
			}

			// Start main/test code
			inMain = true
			braceCount = 0
			currentMain = append(currentMain, line)
			continue
		}

		// Track braces for function/main code
		if inFunction || inMain {
			for _, char := range trimmed {
				if char == '{' {
					braceCount++
				} else if char == '}' {
					braceCount--
					if braceCount <= 0 {
						if inFunction {
							currentFunction = append(currentFunction, line)
							result.Functions = append(result.Functions, strings.Join(currentFunction, "\n"))
							currentFunction = nil
							inFunction = false
						} else if inMain {
							currentMain = append(currentMain, line)
							result.MainCode = append(result.MainCode, strings.Join(currentMain, "\n"))
							currentMain = nil
							inMain = false
						}
						continue
					}
				}
			}

			if inFunction {
				currentFunction = append(currentFunction, line)
			} else if inMain {
				currentMain = append(currentMain, line)
			}
		} else {
			result.OtherCode = append(result.OtherCode, line)
		}
	}

	// Handle remaining function or main code
	if len(currentFunction) > 0 {
		result.Functions = append(result.Functions, strings.Join(currentFunction, "\n"))
	}
	if len(currentMain) > 0 {
		result.MainCode = append(result.MainCode, strings.Join(currentMain, "\n"))
	}

	return result
}

// isImportStatement checks if a line is an import statement
func (p *JavaScriptParser) isImportStatement(line string) bool {
	// ES6 imports
	if matched, _ := regexp.MatchString(`^import\s+.*from\s+["'].*["']`, line); matched {
		return true
	}
	// CommonJS require
	if matched, _ := regexp.MatchString(`^(const|let|var)\s+\w+\s*=\s*require\(["'].*["']\)`, line); matched {
		return true
	}
	// Direct import
	if matched, _ := regexp.MatchString(`^import\s+["'].*["']`, line); matched {
		return true
	}
	return false
}

// isFunctionDeclaration checks if a line is a function declaration
func (p *JavaScriptParser) isFunctionDeclaration(line string) bool {
	// Function declaration: function name() {}
	if matched, _ := regexp.MatchString(`^function\s+\w+\s*\(`, line); matched {
		return true
	}
	// Arrow function: const name = () => {}
	if matched, _ := regexp.MatchString(`^(const|let|var)\s+\w+\s*=\s*\([^)]*\)\s*=>`, line); matched {
		return true
	}
	// Method declaration: name() {}
	if matched, _ := regexp.MatchString(`^\w+\s*\([^)]*\)\s*{`, line); matched {
		return true
	}
	return false
}

// isMainOrTestCode checks if a line is main function or test code
func (p *JavaScriptParser) isMainOrTestCode(line string) bool {
	// Only detect explicit main functions or test execution code
	if strings.HasPrefix(line, "function main()") ||
		strings.HasPrefix(line, "const main") ||
		strings.HasPrefix(line, "let main") ||
		strings.HasPrefix(line, "var main") {
		return true
	}

	// Test execution patterns
	if strings.Contains(line, "console.log(solution") ||
		(strings.Contains(line, "console.log(") && strings.Contains(line, "test")) {
		return true
	}

	return false
}

// GetUserCode returns only the user's function code without imports and main
func (p *JavaScriptParser) GetUserCode(code string) string {
	result := p.ParseJavaScript(code)

	// Combine functions and other code (excluding main)
	userCode := make([]string, 0)
	userCode = append(userCode, result.Functions...)
	userCode = append(userCode, result.OtherCode...)

	return strings.Join(userCode, "\n")
}

// GetImports returns only the import statements
func (p *JavaScriptParser) GetImports(code string) []string {
	result := p.ParseJavaScript(code)
	return result.Imports
}
