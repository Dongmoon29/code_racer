// Problem Form related constants
import type { ProblemFormData } from "@/types";
import {
  DEFAULT_VALUES,
  DIFFICULTY_OPTIONS,
  DIFFICULTY_CONFIG,
} from "@/constants";

export const PROBLEM_FORM_CONSTANTS = {
  // Default values
  DEFAULTS: {
    TITLE: "",
    DESCRIPTION: "",
    EXAMPLES: [{ input: "", output: "", explanation: "" }],
    CONSTRAINTS: "",
    DIFFICULTY: DIFFICULTY_CONFIG.Easy.value,
    FUNCTION_NAME: "",
    TIME_LIMIT: DEFAULT_VALUES.TIME_LIMIT,
    MEMORY_LIMIT: DEFAULT_VALUES.MEMORY_LIMIT,
    IO_SCHEMA: { param_types: ["int"], return_type: "int" },
    TEST_CASES: [{ input: "", expected_output: "" }],
  },

  // Difficulty options (using shared DIFFICULTY_OPTIONS)
  DIFFICULTY_OPTIONS,

  // Form modes
  FORM_MODES: {
    CREATE: "create" as const,
    EDIT: "edit" as const,
  },

  // Messages
  MESSAGES: {
    SUBMITTING: "Submitting...",
    CREATE_SUCCESS: "Problem created successfully!",
    UPDATE_SUCCESS: "Problem updated successfully!",
    ERROR_OCCURRED: "An error occurred. Please try again.",
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
  examples: PROBLEM_FORM_CONSTANTS.DEFAULTS.EXAMPLES.map((example) => ({
    ...example,
  })),
  constraints: PROBLEM_FORM_CONSTANTS.DEFAULTS.CONSTRAINTS,
  test_cases: PROBLEM_FORM_CONSTANTS.DEFAULTS.TEST_CASES.map((testCase) => ({
    ...testCase,
  })),
  difficulty: PROBLEM_FORM_CONSTANTS.DEFAULTS.DIFFICULTY,
  function_name: PROBLEM_FORM_CONSTANTS.DEFAULTS.FUNCTION_NAME,
  time_limit: PROBLEM_FORM_CONSTANTS.DEFAULTS.TIME_LIMIT,
  memory_limit: PROBLEM_FORM_CONSTANTS.DEFAULTS.MEMORY_LIMIT,
  io_schema: {
    param_types: [...PROBLEM_FORM_CONSTANTS.DEFAULTS.IO_SCHEMA.param_types],
    return_type: PROBLEM_FORM_CONSTANTS.DEFAULTS.IO_SCHEMA.return_type,
  },
});
