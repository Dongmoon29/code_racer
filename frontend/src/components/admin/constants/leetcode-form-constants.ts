// LeetCode Form 관련 상수 정의
export const LEETCODE_FORM_CONSTANTS = {
  // 기본값
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
    IO_SCHEMA: { param_types: [], return_type: '' },
    TEST_CASES: [{ input: [], output: '' }],
  },
  
  // 난이도 옵션
  DIFFICULTY_OPTIONS: ['Easy', 'Medium', 'Hard'] as const,
  
  // 폼 모드
  FORM_MODES: {
    CREATE: 'create' as const,
    EDIT: 'edit' as const,
  },
  
  // 메시지
  MESSAGES: {
    SUBMITTING: 'Submitting...',
    CREATE_SUCCESS: 'Problem created successfully!',
    UPDATE_SUCCESS: 'Problem updated successfully!',
    ERROR_OCCURRED: 'An error occurred. Please try again.',
  },
  
  // 유효성 검사
  VALIDATION: {
    MIN_TITLE_LENGTH: 1,
    MIN_DESCRIPTION_LENGTH: 1,
    MIN_FUNCTION_NAME_LENGTH: 1,
  },
} as const;

// 기본 폼 데이터 생성 함수
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
