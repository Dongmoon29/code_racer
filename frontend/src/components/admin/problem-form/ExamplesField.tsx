import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import type { ProblemFormData } from "@/types";

interface ExamplesFieldProps {
  control: Control<ProblemFormData>;
  register: UseFormRegister<ProblemFormData>;
  errors: FieldErrors<ProblemFormData>;
}

const emptyExample = () => ({ input: "", output: "", explanation: "" });

export default function ExamplesField({
  control,
  register,
  errors,
}: ExamplesFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "examples",
    rules: { minLength: 1 },
  });

  return (
    <section className="space-y-3" aria-labelledby="examples-heading">
      <div className="flex items-center justify-between">
        <h3 id="examples-heading" className="text-sm font-medium">
          Examples *
        </h3>
        <button
          type="button"
          onClick={() => append(emptyExample(), { shouldFocus: true })}
          className="rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
        >
          + Add Example
        </button>
      </div>

      {fields.map((field, index) => {
        const inputError = errors.examples?.[index]?.input;
        const outputError = errors.examples?.[index]?.output;

        return (
          <div key={field.id} className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Example {index + 1}</span>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-sm text-red-500 hover:text-red-400"
                >
                  Delete
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="text-xs">
                Input
                <textarea
                  {...register(`examples.${index}.input`, {
                    required: "Example input is required",
                  })}
                  rows={2}
                  aria-invalid={inputError ? true : undefined}
                  className="mt-1 w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="nums = [2,7,11,15], target = 9"
                />
                {inputError && (
                  <span role="alert" className="mt-1 block text-xs text-red-500">
                    {inputError.message}
                  </span>
                )}
              </label>
              <label className="text-xs">
                Output
                <textarea
                  {...register(`examples.${index}.output`, {
                    required: "Example output is required",
                  })}
                  rows={2}
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
            </div>

            <label className="block text-xs">
              Explanation (optional)
              <textarea
                {...register(`examples.${index}.explanation`)}
                rows={2}
                className="mt-1 w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Why this output is correct"
              />
            </label>
          </div>
        );
      })}
    </section>
  );
}
