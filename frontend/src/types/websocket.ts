// WebSocket 메시지 타입 정의

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
  input: unknown;
  expected_output?: unknown;
  expected?: unknown; // Backend sends this field
  actual_output?: unknown;
  actual?: unknown; // Backend sends this field
  passed?: boolean;
  execution_time?: number;
  memory_usage?: number;
  timestamp: number;
}

export interface TestCaseResult {
  index: number;
  input: unknown;
  expectedOutput: unknown;
  actualOutput?: unknown;
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
