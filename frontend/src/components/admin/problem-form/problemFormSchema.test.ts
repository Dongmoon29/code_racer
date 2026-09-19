import { describe, expect, it } from "vitest";
import { createDefaultFormData } from "@/components/admin/constants/problem-form-constants";
import { problemFormSchema } from "./problemFormSchema";

function validProblem() {
  return {
    ...createDefaultFormData(),
    title: "Two Sum",
    description: "Return the indices of two values that add up to the target.",
    constraints: "2 <= nums.length <= 10^4",
    function_name: "twoSum",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "The first two values add up to nine.",
      },
    ],
    test_cases: [{ input: "[[2,7,11,15],9]", expected_output: "[0,1]" }],
  };
}

describe("problem form schema", () => {
  it("accepts a complete problem", async () => {
    await expect(
      problemFormSchema.validate(validProblem()),
    ).resolves.toMatchObject({
      function_name: "twoSum",
    });
  });

  it("requires test inputs to be an array of function arguments", async () => {
    const problem = validProblem();
    problem.test_cases[0].input = "121";

    await expect(problemFormSchema.validate(problem)).rejects.toThrow(
      "Input must be a JSON array of function arguments",
    );
  });

  it("rejects invalid expected-output JSON", async () => {
    const problem = validProblem();
    problem.test_cases[0].expected_output = "not-json";

    await expect(problemFormSchema.validate(problem)).rejects.toThrow(
      "Enter valid JSON",
    );
  });

  it("rejects an invalid function identifier", async () => {
    const problem = validProblem();
    problem.function_name = "two-sum";

    await expect(problemFormSchema.validate(problem)).rejects.toThrow(
      "Use letters, numbers, and underscores",
    );
  });
});
