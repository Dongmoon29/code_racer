-- Production algorithm problem seed
-- Compatible with the simplified problem contract introduced in migration 000011.
-- Test case input is always a JSON array of function arguments.

BEGIN;

INSERT INTO problems (
  id, title, description, constraints, difficulty,
  function_name, time_limit, memory_limit
)
VALUES
  (
    'a1000000-0000-4000-8000-000000000001',
    'Contains Duplicate',
    'Given an integer array nums, return true if any value appears at least twice. Return false if every element is distinct.',
    E'1 <= nums.length <= 100000\n-1000000000 <= nums[i] <= 1000000000',
    'Easy', 'containsDuplicate', 1000, 128
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    'Reverse String',
    'Given a string s, return a new string with its characters in reverse order.',
    E'0 <= s.length <= 100000\ns may contain letters, digits, spaces, and symbols.',
    'Easy', 'reverseString', 1000, 128
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    'Binary Search',
    'Given a sorted integer array nums and an integer target, return the index of target. Return -1 when target is not present.',
    E'1 <= nums.length <= 100000\n-1000000000 <= nums[i], target <= 1000000000\nnums is sorted in strictly increasing order.',
    'Easy', 'search', 1000, 128
  ),
  (
    'b2000000-0000-4000-8000-000000000001',
    'Longest Substring Without Repeating Characters',
    'Given a string s, return the length of the longest substring that contains no repeated characters.',
    E'0 <= s.length <= 50000\ns consists of printable ASCII characters.',
    'Medium', 'lengthOfLongestSubstring', 1500, 128
  ),
  (
    'b2000000-0000-4000-8000-000000000002',
    'Product of Array Except Self',
    'Given an integer array nums, return an array answer where answer[i] is the product of every element except nums[i]. Solve it without using division.',
    E'2 <= nums.length <= 100000\n-30 <= nums[i] <= 30\nEvery prefix and suffix product fits in a signed 32-bit integer.',
    'Medium', 'productExceptSelf', 1500, 128
  ),
  (
    'b2000000-0000-4000-8000-000000000003',
    'Coin Change',
    'Given coin denominations and a target amount, return the fewest coins needed to make that amount. Return -1 if the amount cannot be formed.',
    E'1 <= coins.length <= 12\n1 <= coins[i] <= 2147483647\n0 <= amount <= 10000',
    'Medium', 'coinChange', 1500, 128
  ),
  (
    'c3000000-0000-4000-8000-000000000001',
    'Trapping Rain Water',
    'Given non-negative integers representing an elevation map where each bar has width one, return the total amount of rain water trapped after raining.',
    E'1 <= height.length <= 20000\n0 <= height[i] <= 100000',
    'Hard', 'trap', 2000, 256
  ),
  (
    'c3000000-0000-4000-8000-000000000002',
    'First Missing Positive',
    'Given an unsorted integer array nums, return the smallest positive integer that does not appear in nums. The intended solution uses constant extra space.',
    E'1 <= nums.length <= 100000\n-2147483648 <= nums[i] <= 2147483647',
    'Hard', 'firstMissingPositive', 2000, 256
  ),
  (
    'c3000000-0000-4000-8000-000000000003',
    'Edit Distance',
    'Given two strings word1 and word2, return the minimum number of insertions, deletions, and replacements required to transform word1 into word2.',
    E'0 <= word1.length, word2.length <= 500\nword1 and word2 consist of lowercase English letters.',
    'Hard', 'minDistance', 2500, 256
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  constraints = EXCLUDED.constraints,
  difficulty = EXCLUDED.difficulty,
  function_name = EXCLUDED.function_name,
  time_limit = EXCLUDED.time_limit,
  memory_limit = EXCLUDED.memory_limit,
  updated_at = CURRENT_TIMESTAMP;

-- Rebuild only the child records belonging to these deterministic problem IDs.
DELETE FROM examples WHERE problem_id IN (
  'a1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000003',
  'b2000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000002',
  'b2000000-0000-4000-8000-000000000003',
  'c3000000-0000-4000-8000-000000000001',
  'c3000000-0000-4000-8000-000000000002',
  'c3000000-0000-4000-8000-000000000003'
);

DELETE FROM test_cases WHERE problem_id IN (
  'a1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000003',
  'b2000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000002',
  'b2000000-0000-4000-8000-000000000003',
  'c3000000-0000-4000-8000-000000000001',
  'c3000000-0000-4000-8000-000000000002',
  'c3000000-0000-4000-8000-000000000003'
);

DELETE FROM io_schemas WHERE problem_id IN (
  'a1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000002',
  'a1000000-0000-4000-8000-000000000003',
  'b2000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000002',
  'b2000000-0000-4000-8000-000000000003',
  'c3000000-0000-4000-8000-000000000001',
  'c3000000-0000-4000-8000-000000000002',
  'c3000000-0000-4000-8000-000000000003'
);

INSERT INTO io_schemas (problem_id, param_types, return_type)
VALUES
  ('a1000000-0000-4000-8000-000000000001', '["int[]"]', 'bool'),
  ('a1000000-0000-4000-8000-000000000002', '["string"]', 'string'),
  ('a1000000-0000-4000-8000-000000000003', '["int[]","int"]', 'int'),
  ('b2000000-0000-4000-8000-000000000001', '["string"]', 'int'),
  ('b2000000-0000-4000-8000-000000000002', '["int[]"]', 'int[]'),
  ('b2000000-0000-4000-8000-000000000003', '["int[]","int"]', 'int'),
  ('c3000000-0000-4000-8000-000000000001', '["int[]"]', 'int'),
  ('c3000000-0000-4000-8000-000000000002', '["int[]"]', 'int'),
  ('c3000000-0000-4000-8000-000000000003', '["string","string"]', 'int');

INSERT INTO examples (problem_id, input, output, explanation)
VALUES
  ('a1000000-0000-4000-8000-000000000001', '[1,2,3,1]', 'true', 'The value 1 appears more than once.'),
  ('a1000000-0000-4000-8000-000000000001', '[1,2,3,4]', 'false', 'Every value is distinct.'),
  ('a1000000-0000-4000-8000-000000000002', '"hello"', '"olleh"', 'Reading hello from right to left produces olleh.'),
  ('a1000000-0000-4000-8000-000000000002', '"Code Racer"', '"recaR edoC"', 'Spaces and letter casing are preserved.'),
  ('a1000000-0000-4000-8000-000000000003', 'nums = [-1,0,3,5,9,12], target = 9', '4', 'The target 9 is at index 4.'),
  ('a1000000-0000-4000-8000-000000000003', 'nums = [-1,0,3,5,9,12], target = 2', '-1', 'The target does not exist in nums.'),

  ('b2000000-0000-4000-8000-000000000001', '"abcabcbb"', '3', 'The longest substring without repetition is abc.'),
  ('b2000000-0000-4000-8000-000000000001', '"pwwkew"', '3', 'The answer is wke; the characters do not need to form a subsequence.'),
  ('b2000000-0000-4000-8000-000000000002', '[1,2,3,4]', '[24,12,8,6]', 'Each position contains the product of all other values.'),
  ('b2000000-0000-4000-8000-000000000002', '[-1,1,0,-3,3]', '[0,0,9,0,0]', 'The single zero makes every product except its own zero.'),
  ('b2000000-0000-4000-8000-000000000003', 'coins = [1,2,5], amount = 11', '3', 'Eleven can be formed with 5 + 5 + 1.'),
  ('b2000000-0000-4000-8000-000000000003', 'coins = [2], amount = 3', '-1', 'No combination of denomination 2 forms amount 3.'),

  ('c3000000-0000-4000-8000-000000000001', '[0,1,0,2,1,0,1,3,2,1,2,1]', '6', 'The elevation map traps six units of water.'),
  ('c3000000-0000-4000-8000-000000000001', '[4,2,0,3,2,5]', '9', 'The elevation map traps nine units of water.'),
  ('c3000000-0000-4000-8000-000000000002', '[1,2,0]', '3', 'One and two are present, so three is the first missing positive.'),
  ('c3000000-0000-4000-8000-000000000002', '[3,4,-1,1]', '2', 'One is present and two is absent.'),
  ('c3000000-0000-4000-8000-000000000003', 'word1 = "horse", word2 = "ros"', '3', 'Replace h with r, remove r, and remove e.'),
  ('c3000000-0000-4000-8000-000000000003', 'word1 = "intention", word2 = "execution"', '5', 'Five edits are sufficient and necessary.');

INSERT INTO test_cases (problem_id, input, expected_output)
VALUES
  -- Easy: Contains Duplicate
  ('a1000000-0000-4000-8000-000000000001', '[[1,2,3,1]]', 'true'),
  ('a1000000-0000-4000-8000-000000000001', '[[1,2,3,4]]', 'false'),
  ('a1000000-0000-4000-8000-000000000001', '[[1,1]]', 'true'),
  ('a1000000-0000-4000-8000-000000000001', '[[-1,-2,-3,-1]]', 'true'),
  ('a1000000-0000-4000-8000-000000000001', '[[0]]', 'false'),

  -- Easy: Reverse String
  ('a1000000-0000-4000-8000-000000000002', '["hello"]', '"olleh"'),
  ('a1000000-0000-4000-8000-000000000002', '["a"]', '"a"'),
  ('a1000000-0000-4000-8000-000000000002', '["racecar"]', '"racecar"'),
  ('a1000000-0000-4000-8000-000000000002', '["Code Racer"]', '"recaR edoC"'),
  ('a1000000-0000-4000-8000-000000000002', '[""]', '""'),

  -- Easy: Binary Search
  ('a1000000-0000-4000-8000-000000000003', '[[-1,0,3,5,9,12],9]', '4'),
  ('a1000000-0000-4000-8000-000000000003', '[[-1,0,3,5,9,12],2]', '-1'),
  ('a1000000-0000-4000-8000-000000000003', '[[5],5]', '0'),
  ('a1000000-0000-4000-8000-000000000003', '[[5],-5]', '-1'),
  ('a1000000-0000-4000-8000-000000000003', '[[1,2,3,4,5],1]', '0'),

  -- Medium: Longest Substring Without Repeating Characters
  ('b2000000-0000-4000-8000-000000000001', '["abcabcbb"]', '3'),
  ('b2000000-0000-4000-8000-000000000001', '["bbbbb"]', '1'),
  ('b2000000-0000-4000-8000-000000000001', '["pwwkew"]', '3'),
  ('b2000000-0000-4000-8000-000000000001', '[""]', '0'),
  ('b2000000-0000-4000-8000-000000000001', '["dvdf"]', '3'),

  -- Medium: Product of Array Except Self
  ('b2000000-0000-4000-8000-000000000002', '[[1,2,3,4]]', '[24,12,8,6]'),
  ('b2000000-0000-4000-8000-000000000002', '[[-1,1,0,-3,3]]', '[0,0,9,0,0]'),
  ('b2000000-0000-4000-8000-000000000002', '[[2,3]]', '[3,2]'),
  ('b2000000-0000-4000-8000-000000000002', '[[0,0]]', '[0,0]'),
  ('b2000000-0000-4000-8000-000000000002', '[[-2,-3,-4]]', '[12,8,6]'),

  -- Medium: Coin Change
  ('b2000000-0000-4000-8000-000000000003', '[[1,2,5],11]', '3'),
  ('b2000000-0000-4000-8000-000000000003', '[[2],3]', '-1'),
  ('b2000000-0000-4000-8000-000000000003', '[[1],0]', '0'),
  ('b2000000-0000-4000-8000-000000000003', '[[1],2]', '2'),
  ('b2000000-0000-4000-8000-000000000003', '[[2,5,10,1],27]', '4'),

  -- Hard: Trapping Rain Water
  ('c3000000-0000-4000-8000-000000000001', '[[0,1,0,2,1,0,1,3,2,1,2,1]]', '6'),
  ('c3000000-0000-4000-8000-000000000001', '[[4,2,0,3,2,5]]', '9'),
  ('c3000000-0000-4000-8000-000000000001', '[[1]]', '0'),
  ('c3000000-0000-4000-8000-000000000001', '[[3,0,2,0,4]]', '7'),
  ('c3000000-0000-4000-8000-000000000001', '[[2,0,2]]', '2'),

  -- Hard: First Missing Positive
  ('c3000000-0000-4000-8000-000000000002', '[[1,2,0]]', '3'),
  ('c3000000-0000-4000-8000-000000000002', '[[3,4,-1,1]]', '2'),
  ('c3000000-0000-4000-8000-000000000002', '[[7,8,9,11,12]]', '1'),
  ('c3000000-0000-4000-8000-000000000002', '[[1]]', '2'),
  ('c3000000-0000-4000-8000-000000000002', '[[2,1]]', '3'),

  -- Hard: Edit Distance
  ('c3000000-0000-4000-8000-000000000003', '["horse","ros"]', '3'),
  ('c3000000-0000-4000-8000-000000000003', '["intention","execution"]', '5'),
  ('c3000000-0000-4000-8000-000000000003', '["",""]', '0'),
  ('c3000000-0000-4000-8000-000000000003', '["","abc"]', '3'),
  ('c3000000-0000-4000-8000-000000000003', '["kitten","sitting"]', '3');

COMMIT;
