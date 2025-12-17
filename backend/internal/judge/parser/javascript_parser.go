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
	result := p.newParseResult()
	state := p.newParseState()

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)

		if trimmed == "" {
			p.handleEmptyLine(line, state, result)
			continue
		}

		if p.handleImportLine(line, trimmed, result) {
			continue
		}

		if p.handleFunctionDeclaration(line, trimmed, state, result) {
			continue
		}

		if p.handleMainOrTestCode(line, trimmed, state, result) {
			continue
		}

		p.handleRegularLine(line, trimmed, state, result)
	}

	p.finalizeParseState(state, result)
	return result
}

// parseState tracks the current parsing state
type parseState struct {
	currentFunction []string
	currentMain     []string
	inFunction      bool
	inMain          bool
	braceCount      int
}

// newParseResult creates a new ParseResult with initialized slices
func (p *JavaScriptParser) newParseResult() *ParseResult {
	return &ParseResult{
		Imports:   make([]string, 0),
		Functions: make([]string, 0),
		OtherCode: make([]string, 0),
		MainCode:  make([]string, 0),
	}
}

// newParseState creates a new parse state
func (p *JavaScriptParser) newParseState() *parseState {
	return &parseState{
		currentFunction: make([]string, 0),
		currentMain:     make([]string, 0),
		inFunction:      false,
		inMain:          false,
		braceCount:      0,
	}
}

// handleEmptyLine processes empty lines based on current state
func (p *JavaScriptParser) handleEmptyLine(line string, state *parseState, result *ParseResult) {
	if state.inFunction {
		state.currentFunction = append(state.currentFunction, line)
	} else if state.inMain {
		state.currentMain = append(state.currentMain, line)
	} else {
		result.OtherCode = append(result.OtherCode, line)
	}
}

// handleImportLine processes import statements
func (p *JavaScriptParser) handleImportLine(line, trimmed string, result *ParseResult) bool {
	if p.isImportStatement(trimmed) {
		result.Imports = append(result.Imports, line)
		return true
	}
	return false
}

// handleFunctionDeclaration processes function declarations
func (p *JavaScriptParser) handleFunctionDeclaration(line, trimmed string, state *parseState, result *ParseResult) bool {
	if !p.isFunctionDeclaration(trimmed) {
		return false
	}

	p.saveCurrentFunction(state, result)
	p.startNewFunction(line, state)
	return true
}

// handleMainOrTestCode processes main function or test code
func (p *JavaScriptParser) handleMainOrTestCode(line, trimmed string, state *parseState, result *ParseResult) bool {
	if !p.isMainOrTestCode(trimmed) {
		return false
	}

	p.saveCurrentFunction(state, result)
	p.startMainCode(line, state)
	return true
}

// handleRegularLine processes regular code lines
func (p *JavaScriptParser) handleRegularLine(line, trimmed string, state *parseState, result *ParseResult) {
	if state.inFunction || state.inMain {
		if p.processBraces(line, trimmed, state, result) {
			return
		}
		p.appendToCurrentBlock(line, state)
	} else {
		result.OtherCode = append(result.OtherCode, line)
	}
}

// processBraces tracks braces and closes blocks when appropriate
func (p *JavaScriptParser) processBraces(line, trimmed string, state *parseState, result *ParseResult) bool {
	for _, char := range trimmed {
		if char == '{' {
			state.braceCount++
		} else if char == '}' {
			state.braceCount--
			if state.braceCount <= 0 {
				// Add the closing line before closing the block
				if state.inFunction {
					state.currentFunction = append(state.currentFunction, line)
				} else if state.inMain {
					state.currentMain = append(state.currentMain, line)
				}
				p.closeCurrentBlock(state, result)
				return true
			}
		}
	}
	return false
}

// saveCurrentFunction saves the current function to result
func (p *JavaScriptParser) saveCurrentFunction(state *parseState, result *ParseResult) {
	if len(state.currentFunction) > 0 {
		result.Functions = append(result.Functions, strings.Join(state.currentFunction, "\n"))
		state.currentFunction = nil
	}
}

// startNewFunction starts parsing a new function
func (p *JavaScriptParser) startNewFunction(line string, state *parseState) {
	state.inFunction = true
	state.braceCount = 0
	state.currentFunction = append(state.currentFunction, line)
}

// startMainCode starts parsing main/test code
func (p *JavaScriptParser) startMainCode(line string, state *parseState) {
	state.inMain = true
	state.braceCount = 0
	state.currentMain = append(state.currentMain, line)
}

// appendToCurrentBlock appends line to current function or main block
func (p *JavaScriptParser) appendToCurrentBlock(line string, state *parseState) {
	if state.inFunction {
		state.currentFunction = append(state.currentFunction, line)
	} else if state.inMain {
		state.currentMain = append(state.currentMain, line)
	}
}

// closeCurrentBlock closes the current function or main block
func (p *JavaScriptParser) closeCurrentBlock(state *parseState, result *ParseResult) {
	if state.inFunction {
		// Note: The closing brace line is already processed in processBraces
		// We need to add it here if it wasn't added yet
		// But since we're tracking braces, the line with '}' should already be in currentFunction
		// So we just save it
		result.Functions = append(result.Functions, strings.Join(state.currentFunction, "\n"))
		state.currentFunction = nil
		state.inFunction = false
	} else if state.inMain {
		result.MainCode = append(result.MainCode, strings.Join(state.currentMain, "\n"))
		state.currentMain = nil
		state.inMain = false
	}
}

// finalizeParseState saves any remaining function or main code
func (p *JavaScriptParser) finalizeParseState(state *parseState, result *ParseResult) {
	if len(state.currentFunction) > 0 {
		result.Functions = append(result.Functions, strings.Join(state.currentFunction, "\n"))
	}
	if len(state.currentMain) > 0 {
		result.MainCode = append(result.MainCode, strings.Join(state.currentMain, "\n"))
	}
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
