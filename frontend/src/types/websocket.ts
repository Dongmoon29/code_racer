// WebSocket 메시지 타입 정의

// TestCase 입출력을 위한 타입 (JSON으로 직렬화 가능한 모든 값)
export type TestCaseValue = string | number | boolean | null | TestCaseValue[] | { [key: string]: TestCaseValue };

export interface SubmissionStatusMessage {
  type: 'submission_started' | 'submission_completed' | 'submission_failed';
  match_id: string;
  user_id: string;
  status: 'started' | 'completed' | 'failed';
  passed?: boolean;
  total_test_cases?: number;
  passed_test_cases?: number;
  execution_time?: number;
  memory_usage?: number;
  message: string;
  timestamp: number;
}

export interface TestCaseDetailMessage {
  type: 'test_case_running' | 'test_case_completed';
  match_id: string;
  user_id: string;
  test_case_index: number;
  total_test_cases: number;
  status: 'running' | 'completed';
  input: TestCaseValue;
  expected_output?: TestCaseValue;
  expected?: TestCaseValue; // Backend sends this field
  actual_output?: TestCaseValue;
  actual?: TestCaseValue; // Backend sends this field
  passed?: boolean;
  execution_time?: number;
  memory_usage?: number;
  timestamp: number;
}

export interface TestCaseResult {
  index: number;
  input: TestCaseValue;
  expectedOutput: TestCaseValue;
  actualOutput?: TestCaseValue;
  passed?: boolean;
  status: 'pending' | 'running' | 'completed';
  executionTime?: number;
  memoryUsage?: number;
}

export interface SubmissionProgress {
  isSubmitting: boolean;
  totalTestCases: number;
  completedTestCases: number;
  testCaseResults: TestCaseResult[];
  overallPassed?: boolean;
  executionTime?: number;
  memoryUsage?: number;
  statusMessage?: string;
}
