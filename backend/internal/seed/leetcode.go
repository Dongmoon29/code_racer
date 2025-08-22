package seed

import (
	"fmt"

	"github.com/Dongmoon29/code_racer/internal/model"
	"gorm.io/gorm"
)

// SeedLeetCodeProblem seeds initial LeetCode problems into the database
func SeedLeetCodeProblem(db *gorm.DB) error {
	var count int64
	if err := db.Model(&model.LeetCode{}).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to count leetcode problems: %w", err)
	}

	if count > 0 {
		return nil
	}

	// Test cases 정의
	twoSumTestCases := []model.TestCase{
		{
			Input:  []interface{}{[]interface{}{2, 7, 11, 15}, 9},
			Output: []interface{}{0, 1},
		},
		{
			Input:  []interface{}{[]interface{}{3, 2, 4}, 6},
			Output: []interface{}{1, 2},
		},
		{
			Input:  []interface{}{[]interface{}{3, 3}, 6},
			Output: []interface{}{0, 1},
		},
	}

	palindromeTestCases := []model.TestCase{
		{
			Input:  []interface{}{121},
			Output: true,
		},
		{
			Input:  []interface{}{-121},
			Output: false,
		},
		{
			Input:  []interface{}{10},
			Output: false,
		},
	}

	validParenthesesTestCases := []model.TestCase{
		{
			Input:  []interface{}{"()"},
			Output: true,
		},
		{
			Input:  []interface{}{"()[]{}"},
			Output: true,
		},
		{
			Input:  []interface{}{"(]"},
			Output: false,
		},
	}

	leetcodes := []model.LeetCode{
		{
			Title:       "Two Sum",
			Description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
			Examples: `Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]
Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]`,
			Constraints: `2 <= nums.length <= 10^4
-10^9 <= nums[i] <= 10^9
-10^9 <= target <= 10^9
Only one valid answer exists.`,
			TestCases:       twoSumTestCases,
			ExpectedOutputs: "[0,1]\n[1,2]\n[0,1]",
			Difficulty:      "Easy",
			InputFormat:     "array,number",
			OutputFormat:    "array",
			FunctionName:    "twoSum",
			TimeLimit:       1000,
			MemoryLimit:     128,
			JavaScriptTemplate: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Write your code here
    
}`,
			PythonTemplate: `def twoSum(nums: List[int], target: int) -> List[int]:
    # Write your code here
    pass`,
			GoTemplate: `func twoSum(nums []int, target int) []int {
    // Write your code here
    
}`,
			JavaTemplate: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
        
    }
}`,
			CPPTemplate: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your code here
        
    }
};`,
		},
		{
			Title:       "Palindrome Number",
			Description: "Given an integer x, return true if x is a palindrome, and false otherwise.",
			Examples: `Example 1:
Input: x = 121
Output: true
Explanation: 121 reads as 121 from left to right and from right to left.
Example 2:
Input: x = -121
Output: false
Explanation: From left to right, it reads -121. From right to left, it reads 121-. Therefore it is not a palindrome.
Example 3:
Input: x = 10
Output: false
Explanation: Reads 01 from right to left. Therefore it is not a palindrome.`,
			Constraints:     `-2^31 <= x <= 2^31 - 1`,
			TestCases:       palindromeTestCases,
			ExpectedOutputs: "true\nfalse\nfalse",
			Difficulty:      "Easy",
			InputFormat:     "number",
			OutputFormat:    "boolean",
			FunctionName:    "isPalindromeNumber",
			TimeLimit:       1000,
			MemoryLimit:     128,
			JavaScriptTemplate: `/**
 * @param {number} x
 * @return {boolean}
 */
function isPalindromeNumber(x) {
    // Write your code here
    
}`,
			PythonTemplate: `def isPalindromeNumber(x: int) -> bool:
    # Write your code here
    pass`,
			GoTemplate: `func isPalindromeNumber(x int) bool {
    // Write your code here
    
}`,
			JavaTemplate: `class Solution {
    public boolean isPalindromeNumber(int x) {
        // Write your code here
        
    }
}`,
			CPPTemplate: `class Solution {
public:
    bool isPalindromeNumber(int x) {
        // Write your code here
        
    }
};`,
		},
		{
			Title:       "Valid Parentheses",
			Description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: 1. Open brackets must be closed by the same type of brackets. 2. Open brackets must be closed in the correct order.",
			Examples: `Example 1:
Input: s = "()"
Output: true
Example 2:
Input: s = "()[]{}"
Output: true
Example 3:
Input: s = "(]"
Output: false`,
			Constraints:     `1 <= s.length <= 10^4\ns consists of parentheses only '()[]{}'`,
			TestCases:       validParenthesesTestCases,
			ExpectedOutputs: "true\ntrue\nfalse",
			Difficulty:      "Easy",
			InputFormat:     "string",
			OutputFormat:    "boolean",
			FunctionName:    "isValid",
			TimeLimit:       1000,
			MemoryLimit:     128,
			JavaScriptTemplate: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // Write your code here
    
}`,
			PythonTemplate: `def isValid(s: str) -> bool:
    # Write your code here
    pass`,
			GoTemplate: `func isValid(s string) bool {
    // Write your code here
    
}`,
			JavaTemplate: `class Solution {
    public boolean isValid(String s) {
        // Write your code here
        
    }
}`,
			CPPTemplate: `class Solution {
public:
    bool isValid(string s) {
        // Write your code here
        
    }
};`,
		},
	}

	// Use transaction for atomic operation
	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&leetcodes).Error; err != nil {
			return fmt.Errorf("failed to seed leetcode problems: %w", err)
		}
		return nil
	})
}
