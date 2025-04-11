package service

import (
	"strings"
	"testing"

	"github.com/Dongmoon29/code_racer/internal/constants"
	"github.com/Dongmoon29/code_racer/internal/judge"
	"github.com/Dongmoon29/code_racer/internal/logger"
	"github.com/Dongmoon29/code_racer/internal/model"
	"github.com/Dongmoon29/code_racer/internal/testutil"
	"github.com/stretchr/testify/assert"
)

// setupTestLogger 함수 제거

// setupTestJudgeService creates a JudgeService instance for testing
func setupTestJudgeService(logger logger.Logger) *judgeService {
	return &judgeService{
		codeWrapper:  judge.NewCodeWrapper(logger),
		judge0Client: judge.NewJudge0Client("test-key", "http://test-endpoint"),
		logger:       logger,
	}
}

// normalizeCode removes whitespace and newlines for comparison
func normalizeCode(code string) string {
	// 공백과 줄바꿈을 제거하여 코드 비교를 용이하게 함
	code = strings.ReplaceAll(code, " ", "")
	code = strings.ReplaceAll(code, "\n", "")
	code = strings.ReplaceAll(code, "\t", "")
	return code
}

func TestWrapCodeWithTestCase(t *testing.T) {
	testLogger := testutil.SetupTestLogger()
	service := setupTestJudgeService(testLogger)

	testCases := []struct {
		name         string
		code         string
		languageID   int
		testCase     string
		problem      *model.LeetCode
		expectedCode string
	}{
		{
			name: "JavaScript Two Sum",
			code: `function twoSum(nums, target) {
				const map = new Map();
				for (let i = 0; i < nums.length; i++) {
					const complement = target - nums[i];
					if (map.has(complement)) {
						return [map.get(complement), i];
					}
					map.set(nums[i], i);
				}
				return [];
			}`,
			languageID: constants.LanguageIDJavaScript,
			testCase:   `[[2,7,11,15], 9]`,
			problem: &model.LeetCode{
				FunctionName: "twoSum",
				InputFormat:  "array,number",
				OutputFormat: "array",
			},
			expectedCode: `// 사용자 코드
			function twoSum(nums, target) {
				const map = new Map();
				for (let i = 0; i < nums.length; i++) {
					const complement = target - nums[i];
					if (map.has(complement)) {
						return [map.get(complement), i];
					}
					map.set(nums[i], i);
				}
				return [];
			}

			// 테스트 실행
			function runTest() {
				try {
					const testCase = [[2,7,11,15], 9];
					let inputs = Array.isArray(testCase) ? testCase : [testCase];
					const result = twoSum(...inputs);
					console.log(JSON.stringify(result));
				} catch (error) {
					console.error("Error:", error.message);
					process.exit(1);
				}
			}

			runTest();`,
		},
		{
			name: "Python Two Sum",
			code: `def twoSum(nums, target):
				num_map = {}
				for i, num in enumerate(nums):
					complement = target - num
					if complement in num_map:
						return [num_map[complement], i]
					num_map[num] = i
				return []`,
			languageID: constants.LanguageIDPython,
			testCase:   `[[2,7,11,15], 9]`,
			problem: &model.LeetCode{
				FunctionName: "twoSum",
				InputFormat:  "array,number",
				OutputFormat: "array",
			},
			expectedCode: `
import json
import sys

# 사용자 코드
def twoSum(nums, target):
    num_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i
    return []

# 테스트 실행
def run_test():
    try:
        test_case = json.loads('''[[2,7,11,15], 9]''')
        inputs = test_case if isinstance(test_case, list) else [test_case]
        result = twoSum(*inputs)
        print(json.dumps(result))
    except Exception as e:
        print("Error:", str(e), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    run_test()`,
		},
		{
			name: "Java Two Sum",
			code: `public int[] twoSum(int[] nums, int target) {
				Map<Integer, Integer> map = new HashMap<>();
				for (int i = 0; i < nums.length; i++) {
					int complement = target - nums[i];
					if (map.containsKey(complement)) {
						return new int[] { map.get(complement), i };
					}
					map.put(nums[i], i);
				}
				return new int[0];
			}`,
			languageID: constants.LanguageIDJava,
			testCase:   `[[2,7,11,15], 9]`,
			problem: &model.LeetCode{
				FunctionName: "twoSum",
				InputFormat:  "array,number",
				OutputFormat: "array",
			},
			expectedCode: `
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }

    public static void main(String[] args) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Solution solution = new Solution();
            
            // 테스트 케이스 파싱
            List<Object> inputs = mapper.readValue("[[2,7,11,15], 9]", List.class);
            // 함수 실행
            Object result = solution.twoSum(inputs.toArray());
            // 결과 출력
            System.out.println(mapper.writeValueAsString(result));
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            System.exit(1);
        }
    }
}`,
		},
		{
			name: "C++ Two Sum",
			code: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.find(complement) != map.end()) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};`,
			languageID: constants.LanguageIDCPP,
			testCase:   `[[2,7,11,15], 9]`,
			problem: &model.LeetCode{
				FunctionName: "twoSum",
				InputFormat:  "array,number",
				OutputFormat: "array",
			},
			expectedCode: `
#include <iostream>
#include <string>
#include <vector>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

// 사용자 코드
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.find(complement) != map.end()) {
                return {map[complement], i};
            }
            map[nums[i]] = i;
        }
        return {};
    }
};

int main() {
    try {
        // 테스트 케이스 파싱
        json test_case = json::parse(R"([[2,7,11,15], 9])");
        
        Solution solution;
        // 함수 실행
        auto result = solution.twoSum(test_case);
        // 결과 출력
        std::cout << result.dump() << std::endl;
        
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
}`,
		},
		{
			name: "Go Two Sum",
			code: `func twoSum(nums []int, target int) []int {
				numMap := make(map[int]int)
				for i, num := range nums {
					complement := target - num
					if j, exists := numMap[complement]; exists {
						return []int{j, i}
					}
					numMap[num] = i
				}
				return []int{}
			}`,
			languageID: constants.LanguageIDGo,
			testCase:   `[[2,7,11,15], 9]`,
			problem: &model.LeetCode{
				FunctionName: "twoSum",
				InputFormat:  "array,number",
				OutputFormat: "array",
			},
			expectedCode: `
package main

import (
	"encoding/json"
	"fmt"
	"os"
)

// 사용자 코드
func twoSum(nums []int, target int) []int {
	numMap := make(map[int]int)
	for i, num := range nums {
		complement := target - num
		if j, exists := numMap[complement]; exists {
			return []int{j, i}
		}
		numMap[num] = i
	}
	return []int{}
}

func main() {
	// 테스트 케이스 파싱
	var testCase []interface{}
	if err := json.Unmarshal([]byte("[[2,7,11,15], 9]"), &testCase); err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing test case: %v\n", err)
		os.Exit(1)
	}

	// 함수 실행 및 결과 출력
	defer func() {
		if r := recover(); r != nil {
			fmt.Fprintf(os.Stderr, "Runtime error: %v\n", r)
			os.Exit(1)
		}
	}()

	// 결과 실행 및 출력
	result := twoSum(testCase...)
	output, err := json.Marshal(result)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error marshaling result: %v\n", err)
		os.Exit(1)
	}
	fmt.Println(string(output))
}`,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			wrappedCode, err := service.wrapCodeWithTestCase(tc.code, tc.languageID, tc.testCase, tc.problem)
			if err != nil {
				t.Errorf("Error wrapping code: %v", err)
			}
			normalizedExpected := normalizeCode(tc.expectedCode)
			normalizedActual := normalizeCode(wrappedCode)

			if normalizedExpected != normalizedActual {
				t.Errorf("Code wrapping mismatch after normalization.\nExpected:\n%s\n\nGot:\n%s",
					normalizedExpected, normalizedActual)
			}
		})
	}
}

func TestWrapCodeWithInvalidLanguage(t *testing.T) {
	testLogger := testutil.SetupTestLogger()
	service := setupTestJudgeService(testLogger)

	code := "function test() {}"
	languageID := 9999 // 잘못된 언어 ID
	testCase := "[1,2,3]"
	problem := &model.LeetCode{
		FunctionName: "test",
		InputFormat:  "array",
		OutputFormat: "array",
	}

	_, err := service.wrapCodeWithTestCase(code, languageID, testCase, problem)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unsupported programming language")
}
