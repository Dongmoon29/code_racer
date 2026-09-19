import * as yup from "yup";
import type { ProblemFormData } from "@/types";

function jsonValue(message: string, requireArray = false) {
  return yup
    .string()
    .required(message)
    .test("valid-json", "Enter valid JSON", (value) => {
      if (!value) return false;
      try {
        JSON.parse(value);
        return true;
      } catch {
        return false;
      }
    })
    .test(
      "argument-array",
      "Input must be a JSON array of function arguments",
      (value) => {
        if (!requireArray || !value) return true;
        try {
          return Array.isArray(JSON.parse(value));
        } catch {
          return true;
        }
      },
    );
}

export const problemFormSchema: yup.ObjectSchema<ProblemFormData> = yup.object({
  id: yup.string().optional(),
  title: yup.string().trim().required("Title is required"),
  description: yup.string().trim().required("Problem description is required"),
  examples: yup
    .array()
    .of(
      yup
        .object({
          input: yup.string().required("Example input is required"),
          output: yup.string().required("Example output is required"),
          explanation: yup.string().defined(),
        })
        .defined(),
    )
    .min(1, "Add at least one example")
    .required(),
  constraints: yup.string().trim().required("Constraints are required"),
  test_cases: yup
    .array()
    .of(
      yup
        .object({
          input: jsonValue("Test input is required", true),
          expected_output: jsonValue("Expected output is required"),
        })
        .defined(),
    )
    .min(1, "Add at least one test case")
    .required(),
  difficulty: yup
    .mixed<ProblemFormData["difficulty"]>()
    .oneOf(["Easy", "Medium", "Hard"])
    .required("Difficulty is required"),
  function_name: yup
    .string()
    .trim()
    .matches(
      /^[A-Za-z_][A-Za-z0-9_]*$/,
      "Use letters, numbers, and underscores, starting with a letter or underscore",
    )
    .required("Function name is required"),
  io_schema: yup
    .object({
      param_types: yup
        .array()
        .of(yup.string().required())
        .min(1, "Add at least one function parameter")
        .required(),
      return_type: yup.string().required("Return type is required"),
    })
    .required(),
  time_limit: yup
    .number()
    .typeError("Time limit is required")
    .min(100, "Minimum time limit is 100 ms")
    .required(),
  memory_limit: yup
    .number()
    .typeError("Memory limit is required")
    .min(16, "Minimum memory limit is 16 MB")
    .required(),
  created_at: yup.string().optional(),
  updated_at: yup.string().optional(),
});
