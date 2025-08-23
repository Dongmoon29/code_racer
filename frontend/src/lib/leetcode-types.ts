export interface TestCase {
  input: (string | number | boolean)[];
  output: string | number | boolean;
}

export interface CreateLeetCodeRequest {
  title: string;
  description: string;
  examples: string;
  constraints: string;
  testCases: TestCase[];
  expectedOutputs: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  inputFormat: string;
  outputFormat: string;
  functionName: string;
  javascriptTemplate: string;
  pythonTemplate: string;
  goTemplate: string;
  javaTemplate: string;
  cppTemplate: string;
  timeLimit?: number;
  memoryLimit?: number;
}

export interface UpdateLeetCodeRequest extends Partial<CreateLeetCodeRequest> {
  id: string;
}

export interface LeetCodeSummary {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  createdAt: string;
  updatedAt: string;
}

export interface LeetCodeDetail extends LeetCodeSummary {
  description: string;
  examples: string;
  constraints: string;
  testCases: TestCase[];
  expectedOutputs: string;
  inputFormat: string;
  outputFormat: string;
  functionName: string;
  javascriptTemplate: string;
  pythonTemplate: string;
  goTemplate: string;
  javaTemplate: string;
  cppTemplate: string;
  timeLimit: number;
  memoryLimit: number;
}

export interface LeetCodeFormData {
  title: string;
  description: string;
  examples: string;
  constraints: string;
  testCases: TestCase[];
  expectedOutputs: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  inputFormat: string;
  outputFormat: string;
  functionName: string;
  javascriptTemplate: string;
  pythonTemplate: string;
  goTemplate: string;
  javaTemplate: string;
  cppTemplate: string;
  timeLimit: number;
  memoryLimit: number;
}
