import type { ProblemFormData } from "@/types";

function isValidJson(value: string): boolean {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

export function validateProblemForm(data: ProblemFormData): string | null {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(data.function_name.trim())) {
    return "Function name must start with a letter or underscore and contain only letters, numbers, and underscores.";
  }

  if (data.examples.length === 0) {
    return "Add at least one example.";
  }

  if (data.io_schema.param_types.length === 0) {
    return "Add at least one function parameter.";
  }

  if (data.test_cases.length === 0) {
    return "Add at least one test case.";
  }

  for (const [index, testCase] of data.test_cases.entries()) {
    if (!isValidJson(testCase.input)) {
      return `Test case ${index + 1} input must be valid JSON.`;
    }

    const parsedInput: unknown = JSON.parse(testCase.input);
    if (!Array.isArray(parsedInput)) {
      return `Test case ${index + 1} input must be a JSON array of function arguments.`;
    }

    if (!isValidJson(testCase.expected_output)) {
      return `Test case ${index + 1} expected output must be valid JSON.`;
    }
  }

  if (!Number.isFinite(data.time_limit) || data.time_limit < 100) {
    return "Time limit must be at least 100 ms.";
  }

  if (!Number.isFinite(data.memory_limit) || data.memory_limit < 16) {
    return "Memory limit must be at least 16 MB.";
  }

  return null;
}
