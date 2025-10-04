// LeetCode Form related constants
import { LeetCodeFormData, TestCase } from '@/types';

export const LEETCODE_FORM_CONSTANTS = {
  // Default values
  DEFAULTS: {
    TITLE: '',
    DESCRIPTION: '',
    EXAMPLES: '',
    CONSTRAINTS: '',
    EXPECTED_OUTPUTS: '',
    DIFFICULTY: 'Easy' as const,
    INPUT_FORMAT: '',
    OUTPUT_FORMAT: '',
    FUNCTION_NAME: '',
    JAVASCRIPT_TEMPLATE: '',
    PYTHON_TEMPLATE: '',
    GO_TEMPLATE: '',
    JAVA_TEMPLATE: '',
    CPP_TEMPLATE: '',
    TIME_LIMIT: 1000,
    MEMORY_LIMIT: 128,
    IO_SCHEMA: { param_types: [] as string[], return_type: '' },
    TEST_CASES: [{ input: [], output: '' }] as TestCase[],
  },
  
  // Difficulty options
  DIFFICULTY_OPTIONS: ['Easy', 'Medium', 'Hard'] as const,
  
  // Form modes
  FORM_MODES: {
    CREATE: 'create' as const,
    EDIT: 'edit' as const,
  },
  
  // Messages
  MESSAGES: {
    SUBMITTING: 'Submitting...',
    CREATE_SUCCESS: 'Problem created successfully!',
    UPDATE_SUCCESS: 'Problem updated successfully!',
    ERROR_OCCURRED: 'An error occurred. Please try again.',
  },
  
  // Validation
  VALIDATION: {
    MIN_TITLE_LENGTH: 1,
    MIN_DESCRIPTION_LENGTH: 1,
    MIN_FUNCTION_NAME_LENGTH: 1,
  },
} as const;

// Default form data creation function
export const createDefaultFormData = (): LeetCodeFormData => ({
  title: LEETCODE_FORM_CONSTANTS.DEFAULTS.TITLE,
  description: LEETCODE_FORM_CONSTANTS.DEFAULTS.DESCRIPTION,
  examples: LEETCODE_FORM_CONSTANTS.DEFAULTS.EXAMPLES,
  constraints: LEETCODE_FORM_CONSTANTS.DEFAULTS.CONSTRAINTS,
  test_cases: LEETCODE_FORM_CONSTANTS.DEFAULTS.TEST_CASES,
  expected_outputs: LEETCODE_FORM_CONSTANTS.DEFAULTS.EXPECTED_OUTPUTS,
  difficulty: LEETCODE_FORM_CONSTANTS.DEFAULTS.DIFFICULTY,
  input_format: LEETCODE_FORM_CONSTANTS.DEFAULTS.INPUT_FORMAT,
  output_format: LEETCODE_FORM_CONSTANTS.DEFAULTS.OUTPUT_FORMAT,
  function_name: LEETCODE_FORM_CONSTANTS.DEFAULTS.FUNCTION_NAME,
  javascript_template: LEETCODE_FORM_CONSTANTS.DEFAULTS.JAVASCRIPT_TEMPLATE,
  python_template: LEETCODE_FORM_CONSTANTS.DEFAULTS.PYTHON_TEMPLATE,
  go_template: LEETCODE_FORM_CONSTANTS.DEFAULTS.GO_TEMPLATE,
  java_template: LEETCODE_FORM_CONSTANTS.DEFAULTS.JAVA_TEMPLATE,
  cpp_template: LEETCODE_FORM_CONSTANTS.DEFAULTS.CPP_TEMPLATE,
  time_limit: LEETCODE_FORM_CONSTANTS.DEFAULTS.TIME_LIMIT,
  memory_limit: LEETCODE_FORM_CONSTANTS.DEFAULTS.MEMORY_LIMIT,
  io_schema: LEETCODE_FORM_CONSTANTS.DEFAULTS.IO_SCHEMA,
});
