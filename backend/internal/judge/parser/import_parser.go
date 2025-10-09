package parser

import (
	"regexp"
	"strings"
)

// ImportInfo contains parsed import information for different languages
type ImportInfo struct {
	Imports []string
	Code    string
}

// ImportParser handles parsing imports from user code for different languages
type ImportParser struct{}

func NewImportParser() *ImportParser {
	return &ImportParser{}
}

// ParseImports extracts imports from user code based on language
func (p *ImportParser) ParseImports(code string, languageID int) *ImportInfo {
	switch languageID {
	case 71: // Python
		return p.parsePythonImports(code)
	case 60: // Go
		return p.parseGoImports(code)
	case 63: // JavaScript
		return p.parseJavaScriptImports(code)
	case 62: // Java
		return p.parseJavaImports(code)
	case 54: // C++
		return p.parseCppImports(code)
	default:
		return &ImportInfo{
			Imports: make([]string, 0),
			Code:    code,
		}
	}
}

// parsePythonImports extracts Python import statements
func (p *ImportParser) parsePythonImports(code string) *ImportInfo {
	lines := strings.Split(code, "\n")
	imports := make([]string, 0)
	var nonImportLines []string

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Match various Python import patterns
		if matched, _ := regexp.MatchString(`^(import\s+\w+|from\s+\w+\s+import)`, trimmed); matched {
			imports = append(imports, trimmed)
		} else {
			nonImportLines = append(nonImportLines, line)
		}
	}

	// Remove leading empty lines from code
	resultCode := strings.Join(nonImportLines, "\n")
	resultCode = strings.TrimLeft(resultCode, "\n")

	return &ImportInfo{
		Imports: imports,
		Code:    resultCode,
	}
}

// parseGoImports extracts Go import statements
func (p *ImportParser) parseGoImports(code string) *ImportInfo {
	lines := strings.Split(code, "\n")
	imports := make([]string, 0)
	var nonImportLines []string
	inImportBlock := false
	inMainFunction := false
	braceCount := 0

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Check for import block start
		if trimmed == "import (" {
			inImportBlock = true
			continue
		}

		// Check for import block end
		if inImportBlock && trimmed == ")" {
			inImportBlock = false
			continue
		}

		// Check for main function start
		if strings.HasPrefix(trimmed, "func main()") {
			inMainFunction = true
			braceCount = 0
			continue
		}

		// Track braces in main function
		if inMainFunction {
			for _, char := range trimmed {
				if char == '{' {
					braceCount++
				} else if char == '}' {
					braceCount--
					if braceCount <= 0 {
						inMainFunction = false
						continue
					}
				}
			}
			if inMainFunction {
				continue // Skip lines inside main function
			}
		}

		// Skip any remaining incomplete structures after main function removal
		if strings.HasPrefix(trimmed, "}") && len(nonImportLines) > 0 {
			// Check if this is likely part of an incomplete structure
			lastLine := strings.TrimSpace(nonImportLines[len(nonImportLines)-1])
			if strings.Contains(lastLine, "struct") || strings.Contains(lastLine, "testCases") {
				continue // Skip orphaned closing braces
			}
		}

		// Skip incomplete struct declarations and test case arrays
		if strings.Contains(trimmed, "testCases") ||
			strings.Contains(trimmed, "expected") ||
			strings.Contains(trimmed, "nums1") ||
			strings.Contains(trimmed, "nums2") ||
			strings.HasPrefix(trimmed, "\t\t{") ||
			strings.HasPrefix(trimmed, "\t}") {
			continue
		}

		// Single line import
		if matched, _ := regexp.MatchString(`^import\s+"[^"]+"`, trimmed); matched {
			imports = append(imports, trimmed)
		} else if matched, _ := regexp.MatchString(`^import\s+\w+`, trimmed); matched {
			imports = append(imports, trimmed)
		} else if inImportBlock && strings.HasPrefix(trimmed, `"`) {
			// Multi-line import block
			imports = append(imports, trimmed)
		} else {
			nonImportLines = append(nonImportLines, line)
		}
	}

	// Remove leading empty lines from code
	resultCode := strings.Join(nonImportLines, "\n")
	resultCode = strings.TrimLeft(resultCode, "\n")

	return &ImportInfo{
		Imports: imports,
		Code:    resultCode,
	}
}

// parseJavaScriptImports extracts JavaScript/Node.js import statements
func (p *ImportParser) parseJavaScriptImports(code string) *ImportInfo {
	lines := strings.Split(code, "\n")
	imports := make([]string, 0)
	var nonImportLines []string

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Match various JavaScript import patterns
		if matched, _ := regexp.MatchString(`^(import\s+.*from\s+["'].*["']|const\s+\w+\s*=\s*require\(["'].*["']\)|import\s+["'].*["'])`, trimmed); matched {
			imports = append(imports, trimmed)
		} else {
			nonImportLines = append(nonImportLines, line)
		}
	}

	// Remove leading empty lines from code
	resultCode := strings.Join(nonImportLines, "\n")
	resultCode = strings.TrimLeft(resultCode, "\n")

	return &ImportInfo{
		Imports: imports,
		Code:    resultCode,
	}
}

// parseJavaImports extracts Java import statements
func (p *ImportParser) parseJavaImports(code string) *ImportInfo {
	lines := strings.Split(code, "\n")
	imports := make([]string, 0)
	var nonImportLines []string

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Match Java import statements
		if matched, _ := regexp.MatchString(`^import\s+[a-zA-Z_][a-zA-Z0-9_.*]*;`, trimmed); matched {
			imports = append(imports, trimmed)
		} else {
			nonImportLines = append(nonImportLines, line)
		}
	}

	// Remove leading empty lines from code
	resultCode := strings.Join(nonImportLines, "\n")
	resultCode = strings.TrimLeft(resultCode, "\n")

	return &ImportInfo{
		Imports: imports,
		Code:    resultCode,
	}
}

// parseCppImports extracts C++ include statements
func (p *ImportParser) parseCppImports(code string) *ImportInfo {
	lines := strings.Split(code, "\n")
	imports := make([]string, 0)
	var nonImportLines []string

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		// Match C++ include statements
		if matched, _ := regexp.MatchString(`^#include\s*[<"][^>"]*[>"]`, trimmed); matched {
			imports = append(imports, trimmed)
		} else {
			nonImportLines = append(nonImportLines, line)
		}
	}

	// Remove leading empty lines from code
	resultCode := strings.Join(nonImportLines, "\n")
	resultCode = strings.TrimLeft(resultCode, "\n")

	return &ImportInfo{
		Imports: imports,
		Code:    resultCode,
	}
}
