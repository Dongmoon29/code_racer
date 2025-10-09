package parser

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestJavaScriptParser_Debug(t *testing.T) {
	parser := NewJavaScriptParser()

	// 간단한 테스트
	code := `const fs = require('fs');

function solution(nums) {
    return nums.sort((a, b) => a - b);
}`

	fmt.Println("=== Import 테스트 ===")
	imports := parser.GetImports(code)
	fmt.Printf("Imports: %v\n", imports)

	fmt.Println("\n=== User Code 테스트 ===")
	userCode := parser.GetUserCode(code)
	fmt.Printf("User Code:\n%s\n", userCode)

	fmt.Println("\n=== Parse 결과 ===")
	result := parser.ParseJavaScript(code)
	fmt.Printf("Functions: %d개\n", len(result.Functions))
	for i, fn := range result.Functions {
		fmt.Printf("Function %d: %s\n", i+1, fn)
	}

	// 실제로는 정상 작동하는지 확인
	assert.Len(t, imports, 1, "Should have 1 import")
	assert.Contains(t, imports[0], "require('fs')", "Should contain require")
	assert.Contains(t, userCode, "function solution", "Should contain solution function")
	assert.NotContains(t, userCode, "main", "Should not contain main")
}
