// Problem Form related constants
import {
  ProblemFormData,
  TestCase,
  IOTemplateRequest,
  ExampleRequest,
} from '@/types';
import { DEFAULT_VALUES, DIFFICULTY_OPTIONS, DIFFICULTY_CONFIG } from '@/constants';

export const PROBLEM_FORM_CONSTANTS = {
  // Default values
  DEFAULTS: {
    TITLE: '',
    DESCRIPTION: '',
    EXAMPLES: [] as ExampleRequest[],
    CONSTRAINTS: '',
    EXPECTED_OUTPUTS: [] as string[],
    DIFFICULTY: DIFFICULTY_CONFIG.Easy.value,
    INPUT_FORMAT: '',
    OUTPUT_FORMAT: '',
    FUNCTION_NAME: '',
    IO_TEMPLATES: [] as IOTemplateRequest[],
    TIME_LIMIT: DEFAULT_VALUES.TIME_LIMIT,
    MEMORY_LIMIT: DEFAULT_VALUES.MEMORY_LIMIT,
    IO_SCHEMA: { param_types: [] as string[], return_type: '' },
    TEST_CASES: [{ input: '', expected_output: '' }] as TestCase[],
  },

  // Difficulty options (using shared DIFFICULTY_OPTIONS)
  DIFFICULTY_OPTIONS,

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
  io_templates: PROBLEM_FORM_CONSTANTS.DEFAULTS.IO_TEMPLATES,
  time_limit: PROBLEM_FORM_CONSTANTS.DEFAULTS.TIME_LIMIT,
  memory_limit: PROBLEM_FORM_CONSTANTS.DEFAULTS.MEMORY_LIMIT,
  io_schema: PROBLEM_FORM_CONSTANTS.DEFAULTS.IO_SCHEMA,
});
