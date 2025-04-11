package seed

import (
	"github.com/Dongmoon29/code_racer/internal/model"
	"gorm.io/gorm"
)

// SeedLeetCodeProblem seeds initial LeetCode problems into the database
func SeedLeetCodeProblem(db *gorm.DB) error {
	var count int64
	db.Model(&model.LeetCode{}).Count(&count)
	if count == 0 {
		// Two Sum 문제의 테스트 케이스를 JSON으로 직렬화
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

		// Palindrome 문제의 테스트 케이스를 JSON으로 직렬화
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
				FunctionName:    "isPalindrome",
				TimeLimit:       1000,
				MemoryLimit:     128,
				JavaScriptTemplate: `/**
 * @param {number} x
 * @return {boolean}
 */
function isPalindrome(x) {
    // Write your code here
    
}`,
				PythonTemplate: `def isPalindrome(x: int) -> bool:
    # Write your code here
    pass`,
				GoTemplate: `func isPalindrome(x int) bool {
    // Write your code here
    
}`,
				JavaTemplate: `class Solution {
    public boolean isPalindrome(int x) {
        // Write your code here
        
    }
}`,
				CPPTemplate: `class Solution {
public:
    bool isPalindrome(int x) {
        // Write your code here
        
    }
};`,
			},
		}

		return db.Create(&leetcodes).Error
	}
	return nil
}
