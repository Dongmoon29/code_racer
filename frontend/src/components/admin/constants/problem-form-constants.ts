// Problem Form related constants
import { ProblemFormData, TestCase } from '@/types';
import { DEFAULT_VALUES } from '@/constants';

export const PROBLEM_FORM_CONSTANTS = {
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
    TIME_LIMIT: DEFAULT_VALUES.TIME_LIMIT,
    MEMORY_LIMIT: DEFAULT_VALUES.MEMORY_LIMIT,
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
    MIN_TITLE_LENGTH: DEFAULT_VALUES.MIN_TITLE_LENGTH,
    MIN_DESCRIPTION_LENGTH: DEFAULT_VALUES.MIN_DESCRIPTION_LENGTH,
    MIN_FUNCTION_NAME_LENGTH: DEFAULT_VALUES.MIN_FUNCTION_NAME_LENGTH,
  },
} as const;

// Default form data creation function
export const createDefaultFormData = (): ProblemFormData => ({
  title: PROBLEM_FORM_CONSTANTS.DEFAULTS.TITLE,
  description: PROBLEM_FORM_CONSTANTS.DEFAULTS.DESCRIPTION,
  examples: PROBLEM_FORM_CONSTANTS.DEFAULTS.EXAMPLES,
  constraints: PROBLEM_FORM_CONSTANTS.DEFAULTS.CONSTRAINTS,
  test_cases: PROBLEM_FORM_CONSTANTS.DEFAULTS.TEST_CASES,
  expected_outputs: PROBLEM_FORM_CONSTANTS.DEFAULTS.EXPECTED_OUTPUTS,
  difficulty: PROBLEM_FORM_CONSTANTS.DEFAULTS.DIFFICULTY,
  input_format: PROBLEM_FORM_CONSTANTS.DEFAULTS.INPUT_FORMAT,
  output_format: PROBLEM_FORM_CONSTANTS.DEFAULTS.OUTPUT_FORMAT,
  function_name: PROBLEM_FORM_CONSTANTS.DEFAULTS.FUNCTION_NAME,
  javascript_template: PROBLEM_FORM_CONSTANTS.DEFAULTS.JAVASCRIPT_TEMPLATE,
  python_template: PROBLEM_FORM_CONSTANTS.DEFAULTS.PYTHON_TEMPLATE,
  go_template: PROBLEM_FORM_CONSTANTS.DEFAULTS.GO_TEMPLATE,
  java_template: PROBLEM_FORM_CONSTANTS.DEFAULTS.JAVA_TEMPLATE,
  cpp_template: PROBLEM_FORM_CONSTANTS.DEFAULTS.CPP_TEMPLATE,
  time_limit: PROBLEM_FORM_CONSTANTS.DEFAULTS.TIME_LIMIT,
  memory_limit: PROBLEM_FORM_CONSTANTS.DEFAULTS.MEMORY_LIMIT,
  io_schema: PROBLEM_FORM_CONSTANTS.DEFAULTS.IO_SCHEMA,
});
