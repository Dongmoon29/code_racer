import { describe, expect, it } from "vitest";
import { formatExampleInput } from "./problem-display";

describe("formatExampleInput", () => {
  it("removes the JSON argument envelope from scalar inputs", () => {
    expect(formatExampleInput('["hello"]', ["string"])).toBe('"hello"');
    expect(formatExampleInput("[121]", ["int"])).toBe("121");
  });

  it("preserves arrays that are actual parameter values", () => {
    expect(formatExampleInput("[[1,2,3]]", ["int[]"])).toBe("[1,2,3]");
    expect(formatExampleInput('["hello"]', ["string[]"])).toBe('["hello"]');
  });

  it("shows multiple arguments without their transport-level brackets", () => {
    expect(formatExampleInput("[[2,7,11,15],9]", ["int[]", "int"])).toBe(
      "[2,7,11,15], 9",
    );
  });

  it("leaves legacy or invalid example text unchanged", () => {
    expect(formatExampleInput("nums = [1,2,3]", ["int[]"])).toBe(
      "nums = [1,2,3]",
    );
  });
});
