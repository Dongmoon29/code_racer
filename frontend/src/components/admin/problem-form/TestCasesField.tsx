import type { TestCase } from "@/types";

interface TestCasesFieldProps {
  testCases: TestCase[];
  onChange: (testCases: TestCase[]) => void;
}

const emptyTestCase = (): TestCase => ({ input: "", expected_output: "" });

export default function TestCasesField({
  testCases,
  onChange,
}: TestCasesFieldProps) {
  const updateTestCase = (
    index: number,
    field: keyof TestCase,
    value: string,
  ) => {
    onChange(
      testCases.map((testCase, currentIndex) =>
        currentIndex === index ? { ...testCase, [field]: value } : testCase,
      ),
    );
  };

  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      onChange(testCases.filter((_, currentIndex) => currentIndex !== index));
    }
  };

  return (
    <section className="space-y-3" aria-labelledby="test-cases-heading">
      <div className="flex items-center justify-between">
        <h3 id="test-cases-heading" className="text-sm font-medium">
          Test Cases *
        </h3>
        <button
          type="button"
          onClick={() => onChange([...testCases, emptyTestCase()])}
          className="rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
        >
          + Add Test Case
        </button>
      </div>

      {testCases.map((testCase, index) => (
        <div
          key={index}
          className="grid grid-cols-1 items-end gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_auto]"
        >
          <label className="text-xs">
            Input
            <input
              type="text"
              value={testCase.input}
              onChange={(event) =>
                updateTestCase(index, "input", event.target.value)
              }
              className="mt-1 w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="[[2,7,11,15], 9]"
              required
            />
          </label>
          <label className="text-xs">
            Expected Output
            <input
              type="text"
              value={testCase.expected_output}
              onChange={(event) =>
                updateTestCase(index, "expected_output", event.target.value)
              }
              className="mt-1 w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="[0,1]"
              required
            />
          </label>
          {testCases.length > 1 && (
            <button
              type="button"
              onClick={() => removeTestCase(index)}
              className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
            >
              Delete
            </button>
          )}
        </div>
      ))}

      <p className="text-xs text-[var(--gray-10)]">
        Input is a JSON array of function arguments. A single parameter still
        uses an array, for example [121].
      </p>
    </section>
  );
}
