export interface TestCase {
  input: (string | number | boolean)[];
  output: string | number | boolean;
}

export interface CreateLeetCodeRequest {
  title: string;
  description: string;
  examples: string;
  constraints: string;
  test_cases: TestCase[];
  expected_outputs: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  input_format: string;
  output_format: string;
  function_name: string;
  javascript_template: string;
  python_template: string;
  go_template: string;
  java_template: string;
  cpp_template: string;
  time_limit?: number;
  memory_limit?: number;
}

export interface UpdateLeetCodeRequest extends Partial<CreateLeetCodeRequest> {
  id: string;
}

export interface LeetCodeSummary {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  created_at: string;
  updated_at: string;
}

export interface LeetCodeDetail extends LeetCodeSummary {
  description: string;
  examples: string;
  constraints: string;
  test_cases: TestCase[];
  expected_outputs: string;
  input_format: string;
  output_format: string;
  function_name: string;
  javascript_template: string;
  python_template: string;
  go_template: string;
  java_template: string;
  cpp_template: string;
  time_limit: number;
  memory_limit: number;
}

export interface LeetCodeFormData {
  id?: string;
  title: string;
  description: string;
  examples: string;
  constraints: string;
  test_cases: TestCase[];
  expected_outputs: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  input_format: string;
  output_format: string;
  function_name: string;
  javascript_template: string;
  python_template: string;
  go_template: string;
  java_template: string;
  cpp_template: string;
  time_limit: number;
  memory_limit: number;
  created_at?: string;
  updated_at?: string;
}
