package seed

import (
	"fmt"

	"github.com/Dongmoon29/code_racer/internal/model"
	"gorm.io/gorm"
)

// SeedProblems seeds the database with initial problem data
func SeedProblems(db *gorm.DB) error {
	// Check if problems already exist
	var count int64
	if err := db.Model(&model.Problem{}).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		fmt.Println("Problems already exist, skipping seeding...")
		return nil
	}

	fmt.Println("Seeding problems...")

	// Create problems with their related entities
	problems := []model.Problem{
		{
			Title:       "Two Sum",
			Description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
			Constraints: `2 <= nums.length <= 10^4
-10^9 <= nums[i] <= 10^9
-10^9 <= target <= 10^9
Only one valid answer exists.`,
			Difficulty:    "Easy",
			InputFormat:   "array,number",
			OutputFormat:  "array",
			FunctionName:  "twoSum",
			TimeLimit:     1000,
			MemoryLimit:   128,
			Examples: []model.Example{
				{
					Input:       `[2,7,11,15], 9`,
					Output:      `[0,1]`,
					Explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
				},
				{
					Input:       `[3,2,4], 6`,
					Output:      `[1,2]`,
					Explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
				},
				{
					Input:       `[3,3], 6`,
					Output:      `[0,1]`,
					Explanation: "Because nums[0] + nums[1] == 6, we return [0, 1].",
				},
			},
			TestCases: []model.TestCase{
				{
					Input:          `[[2,7,11,15],9]`,
					ExpectedOutput: `[0,1]`,
				},
				{
					Input:          `[[3,2,4],6]`,
					ExpectedOutput: `[1,2]`,
				},
				{
					Input:          `[[3,3],6]`,
					ExpectedOutput: `[0,1]`,
				},
			},
			IOTemplates: []model.IOTemplate{
				{
					Language: "javascript",
					Code: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Write your code here
    
}`,
				},
				{
					Language: "python",
					Code: `def twoSum(nums: List[int], target: int) -> List[int]:
    # Write your code here
    pass`,
				},
				{
					Language: "go",
					Code: `func twoSum(nums []int, target int) []int {
    // Write your code here
    
}`,
				},
				{
					Language: "java",
					Code: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
        
    }
}`,
				},
			},
			IOSchema: model.IOSchema{
				ParamTypes: `["int[]", "int"]`,
				ReturnType: "int[]",
			},
		},
		{
			Title:       "Palindrome Number",
			Description: "Given an integer x, return true if x is a palindrome, and false otherwise.",
			Constraints: `-2^31 <= x <= 2^31 - 1`,
			Difficulty:    "Easy",
			InputFormat:   "number",
			OutputFormat:  "boolean",
			FunctionName:  "isPalindrome",
			TimeLimit:     1000,
			MemoryLimit:   128,
			Examples: []model.Example{
				{
					Input:       `121`,
					Output:      `true`,
					Explanation: "121 reads as 121 from left to right and from right to left.",
				},
				{
					Input:       `-121`,
					Output:      `false`,
					Explanation: "From left to right, it reads -121. From right to left, it reads 121-. Therefore it is not a palindrome.",
				},
				{
					Input:       `10`,
					Output:      `false`,
					Explanation: "Reads 01 from right to left. Therefore it is not a palindrome.",
				},
			},
			TestCases: []model.TestCase{
				{
					Input:          `121`,
					ExpectedOutput: `true`,
				},
				{
					Input:          `-121`,
					ExpectedOutput: `false`,
				},
				{
					Input:          `10`,
					ExpectedOutput: `false`,
				},
			},
			IOTemplates: []model.IOTemplate{
				{
					Language: "javascript",
					Code: `/**
 * @param {number} x
 * @return {boolean}
 */
function isPalindrome(x) {
    // Write your code here
    
}`,
				},
				{
					Language: "python",
					Code: `def isPalindrome(x: int) -> bool:
    # Write your code here
    pass`,
				},
				{
					Language: "go",
					Code: `func isPalindrome(x int) bool {
    // Write your code here
    
}`,
				},
				{
					Language: "java",
					Code: `class Solution {
    public boolean isPalindrome(int x) {
        // Write your code here
        
    }
}`,
				},
			},
			IOSchema: model.IOSchema{
				ParamTypes: `["int"]`,
				ReturnType: "boolean",
			},
		},
		{
			Title:       "Valid Parentheses",
			Description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
			Constraints: `1 <= s.length <= 10^4
s consists of parentheses only '()[]{}'`,
			Difficulty:    "Easy",
			InputFormat:   "string",
			OutputFormat:  "boolean",
			FunctionName:  "isValid",
			TimeLimit:     1000,
			MemoryLimit:   128,
			Examples: []model.Example{
				{
					Input:       `"()"`,
					Output:      `true`,
					Explanation: "The string contains valid parentheses.",
				},
				{
					Input:       `"()[]{}"`,
					Output:      `true`,
					Explanation: "The string contains valid parentheses.",
				},
				{
					Input:       `"(]"`,
					Output:      `false`,
					Explanation: "The string contains invalid parentheses.",
				},
			},
			TestCases: []model.TestCase{
				{
					Input:          `"()"`,
					ExpectedOutput: `true`,
				},
				{
					Input:          `"()[]{}"`,
					ExpectedOutput: `true`,
				},
				{
					Input:          `"(]"`,
					ExpectedOutput: `false`,
				},
			},
			IOTemplates: []model.IOTemplate{
				{
					Language: "javascript",
					Code: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // Write your code here
    
}`,
				},
				{
					Language: "python",
					Code: `def isValid(s: str) -> bool:
    # Write your code here
    pass`,
				},
				{
					Language: "go",
					Code: `func isValid(s string) bool {
    // Write your code here
    
}`,
				},
				{
					Language: "java",
					Code: `class Solution {
    public boolean isValid(String s) {
        // Write your code here
        
    }
}`,
				},
			},
			IOSchema: model.IOSchema{
				ParamTypes: `["string"]`,
				ReturnType: "boolean",
			},
		},
	}

	// Create problems with their related entities
	for _, problem := range problems {
		if err := db.Create(&problem).Error; err != nil {
			return fmt.Errorf("failed to create problem %s: %w", problem.Title, err)
		}
	}

	fmt.Printf("Successfully seeded %d problems\n", len(problems))
	return nil
}

