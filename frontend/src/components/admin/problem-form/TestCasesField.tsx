import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import type { ProblemFormData } from "@/types";

interface TestCasesFieldProps {
  control: Control<ProblemFormData>;
  register: UseFormRegister<ProblemFormData>;
  errors: FieldErrors<ProblemFormData>;
}

const emptyTestCase = () => ({ input: "", expected_output: "" });

function validateJson(value: string, requireArray = false): true | string {
  try {
    const parsed: unknown = JSON.parse(value);
    if (requireArray && !Array.isArray(parsed)) {
      return "Input must be a JSON array of function arguments";
    }
    return true;
  } catch {
    return "Enter valid JSON";
  }
}

export default function TestCasesField({
  control,
  register,
  errors,
}: TestCasesFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "test_cases",
    rules: { minLength: 1 },
  });

  return (
    <section className="space-y-3" aria-labelledby="test-cases-heading">
      <div className="flex items-center justify-between">
        <h3 id="test-cases-heading" className="text-sm font-medium">
          Test Cases *
        </h3>
        <button
          type="button"
          onClick={() => append(emptyTestCase(), { shouldFocus: true })}
          className="rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
        >
          + Add Test Case
        </button>
      </div>

      {fields.map((field, index) => {
        const inputError = errors.test_cases?.[index]?.input;
        const outputError = errors.test_cases?.[index]?.expected_output;

        return (
          <div
            key={field.id}
            className="grid grid-cols-1 items-start gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_auto]"
          >
            <label className="text-xs">
              Input
              <input
                type="text"
                {...register(`test_cases.${index}.input`, {
                  required: "Test input is required",
                  validate: (value) => validateJson(value, true),
                })}
                aria-invalid={inputError ? true : undefined}
                className="mt-1 w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="[[2,7,11,15], 9]"
              />
              {inputError && (
                <span role="alert" className="mt-1 block text-xs text-red-500">
                  {inputError.message}
                </span>
              )}
            </label>
            <label className="text-xs">
              Expected Output
              <input
                type="text"
                {...register(`test_cases.${index}.expected_output`, {
                  required: "Expected output is required",
                  validate: (value) => validateJson(value),
                })}
                aria-invalid={outputError ? true : undefined}
                className="mt-1 w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="[0,1]"
              />
              {outputError && (
                <span role="alert" className="mt-1 block text-xs text-red-500">
                  {outputError.message}
                </span>
              )}
            </label>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="mt-5 rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
              >
                Delete
              </button>
            )}
          </div>
        );
      })}

      <p className="text-xs text-[var(--gray-10)]">
        Input is a JSON array of function arguments. A single parameter still
        uses an array, for example [121].
      </p>
    </section>
  );
}
