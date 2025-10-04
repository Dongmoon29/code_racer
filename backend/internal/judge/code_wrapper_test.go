package judge

import (
	"strings"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
)

// setupTestLogger creates a test logger
func setupTestLogger() *zerolog.Logger {
	logger := zerolog.New(zerolog.NewTestWriter(nil)).With().Timestamp().Logger()
	return &logger
}

func TestGetLanguageWrapper(t *testing.T) {
	logger := setupTestLogger()
	wrapper := NewCodeWrapper(logger)

	tests := []struct {
		name        string
		languageID  int
		wantWrapper bool
		wantErr     bool
		errMessage  string
	}{
		{
			name:        "valid_javascript",
			languageID:  63, // JavaScript ID
			wantWrapper: true,
			wantErr:     false,
		},
		{
			name:        "valid_python",
			languageID:  71, // Python ID
			wantWrapper: true,
			wantErr:     false,
		},
		{
			name:        "valid_go",
			languageID:  60, // Go ID
			wantWrapper: true,
			wantErr:     false,
		},
		{
			name:        "valid_java",
			languageID:  62, // Java ID
			wantWrapper: true,
			wantErr:     false,
		},
		{
			name:        "valid_cpp",
			languageID:  54, // C++ ID
			wantWrapper: true,
			wantErr:     false,
		},
		{
			name:        "invalid_language_id",
			languageID:  9999,
			wantWrapper: false,
			wantErr:     true,
			errMessage:  "unsupported programming language ID: 9999",
		},
		{
			name:        "negative_language_id",
			languageID:  -1,
			wantWrapper: false,
			wantErr:     true,
			errMessage:  "unsupported programming language ID: -1",
		},
		{
			name:        "zero_language_id",
			languageID:  0,
			wantWrapper: false,
			wantErr:     true,
			errMessage:  "unsupported programming language ID: 0",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			wrapperFunc, err := wrapper.getLanguageWrapper(tt.languageID)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Equal(t, tt.errMessage, err.Error())
				assert.Nil(t, wrapperFunc)
			} else {
				assert.NoError(t, err)
				assert.NotNil(t, wrapperFunc)

				// Test if the returned wrapper function is actually executable
				problem := &model.LeetCode{
					FunctionName: "testFunc",
					InputFormat:  "array",
					OutputFormat: "array",
				}
				result := wrapperFunc("test code", "[1,2,3]", problem)
				assert.NotEmpty(t, result)
			}
		})
	}
}

func TestLanguageWrapperFunctionTypes(t *testing.T) {
	logger := setupTestLogger()
	wrapper := NewCodeWrapper(logger)

	t.Run("wrapper_functions_return_correct_type", func(t *testing.T) {
		// JavaScript
		wrapperFunc, err := wrapper.getLanguageWrapper(63)
		assert.NoError(t, err)
		assert.IsType(t, wrapper.wrapJavaScript, wrapperFunc)

		// Python
		wrapperFunc, err = wrapper.getLanguageWrapper(71)
		assert.NoError(t, err)
		assert.IsType(t, wrapper.wrapPython, wrapperFunc)

		// Go
		wrapperFunc, err = wrapper.getLanguageWrapper(60)
		assert.NoError(t, err)
		assert.IsType(t, wrapper.wrapGo, wrapperFunc)

		// Java
		wrapperFunc, err = wrapper.getLanguageWrapper(62)
		assert.NoError(t, err)
		assert.IsType(t, wrapper.wrapJava, wrapperFunc)

		// C++
		wrapperFunc, err = wrapper.getLanguageWrapper(54)
		assert.NoError(t, err)
		assert.IsType(t, wrapper.wrapCPP, wrapperFunc)
	})
}

func TestLanguageWrappers(t *testing.T) {
	logger := setupTestLogger()
	wrapper := NewCodeWrapper(logger)

	problem := &model.LeetCode{
		FunctionName: "solution",
		InputFormat:  "array",
		OutputFormat: "array",
	}
	testCase := "[1,2,3]"

	tests := []struct {
		name       string
		code       string
		languageID int
		want       string
	}{
		{
			name:       "javascript_wrapper",
			code:       "function solution(arr) { return arr.map(x => x * 2); }",
			languageID: 63,
			want: `
// User code
function solution(arr) { return arr.map(x => x * 2); }

// Test execution
function runTest() {
    try {
        const testCase = JSON.parse("[1,2,3]");
        const inputs = Array.isArray(testCase) ? testCase : [testCase];
        const result = solution(...inputs);
        console.log(JSON.stringify(result));
    } catch (error) {
        console.error(String(error));
        process.exit(1);
    }
}

runTest();`,
		},
		{
			name:       "python_wrapper",
			code:       "def solution(arr):\n    return [x * 2 for x in arr]",
			languageID: 71,
			want: `
import json
import sys

# 사용자 코드
def solution(arr):
    return [x * 2 for x in arr]

# 테스트 실행
def run_test():
    try:
        test_case = json.loads('[1,2,3]')
        inputs = test_case if isinstance(test_case, list) else [test_case]
        result = solution(*inputs)
        print(json.dumps(result))
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_test()`,
		},
		{
			name:       "go_wrapper",
			code:       "func solution(arr ...interface{}) interface{} {\n    return arr\n}",
			languageID: 60,
			want: `
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

// User code
func solution(arr ...interface{}) interface{} {
    return arr
}

func main() {
    // Test case parsing
    var testCase []interface{}
    if err := json.Unmarshal([]byte("[1,2,3]"), &testCase); err != nil {
        fmt.Fprintf(os.Stderr, "Error parsing test case: %v\n", err)
        os.Exit(1)
    }

    // Function execution and result output
    defer func() {
        if r := recover(); r != nil {
            fmt.Fprintf(os.Stderr, "Runtime error: %v\n", r)
            os.Exit(1)
        }
    }()

    // Result execution and output
    result := solution(testCase...)
    output, err := json.Marshal(result)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error marshaling result: %v\n", err)
        os.Exit(1)
    }
    // Remove debug prints - use proper logging instead
}`,
		},
		{
			name:       "java_wrapper",
			code:       "public int[] solution(Object[] arr) {\n    return new int[]{1, 2, 3};\n}",
			languageID: 62,
			want: `
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;

public class Solution {
    public int[] solution(Object[] arr) {
    return new int[]{1, 2, 3};
}

    public static void main(String[] args) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Solution solution = new Solution();
            
            // Test case parsing
            List<Object> inputs = mapper.readValue("[1,2,3]", List.class);
            
            // Function execution
            Object result = solution.solution(inputs.toArray());
            
            // Result output
            System.out.println(mapper.writeValueAsString(result));
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            System.exit(1);
        }
    }
}`,
		},
		{
			name:       "cpp_wrapper",
			code:       "class Solution {\npublic:\n    json solution(json& arr) {\n        return arr;\n    }\n};",
			languageID: 54,
			want: `
#include <iostream>
#include <string>
#include <vector>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

// User code
class Solution {
public:
    json solution(json& arr) {
        return arr;
    }
};

int main() {
    try {
        // Test case parsing
        json test_case = json::parse(R"([1,2,3])");
        
        Solution solution;
        
        // Function execution
        auto result = solution.solution(test_case);
        
        // Result output
        std::cout << result.dump() << std::endl;
        
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			wrapperFunc, err := wrapper.getLanguageWrapper(tt.languageID)
			assert.NoError(t, err)

			got := wrapperFunc(tt.code, testCase, problem)
			// Compare ignoring whitespace
			assert.Equal(t,
				strings.ReplaceAll(strings.TrimSpace(tt.want), " ", ""),
				strings.ReplaceAll(strings.TrimSpace(got), " ", ""),
				"wrapper output mismatch",
			)
		})
	}
}
