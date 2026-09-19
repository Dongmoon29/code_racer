import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import type { ProblemFormData } from "@/types";
import {
  dangerFormButtonClass,
  formControlClass,
  formErrorClass,
  formHintClass,
  secondaryFormButtonClass,
} from "@/components/ui/FormPrimitives";
import { cn } from "@/lib/utils";

interface TestCasesFieldProps {
  control: Control<ProblemFormData>;
  register: UseFormRegister<ProblemFormData>;
  errors: FieldErrors<ProblemFormData>;
}

const emptyTestCase = () => ({ input: "", expected_output: "" });

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--gray-11)]">
          {fields.length} test case{fields.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => append(emptyTestCase(), { shouldFocus: true })}
          className={cn(secondaryFormButtonClass, "min-h-9 px-3")}
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
            className="grid grid-cols-1 items-start gap-4 rounded-xl border border-[var(--gray-6)] bg-[var(--gray-2)]/40 p-4 md:grid-cols-[1fr_1fr_auto]"
          >
            <label className="text-sm font-semibold">
              Input
              <input
                type="text"
                {...register(`test_cases.${index}.input`)}
                aria-invalid={inputError ? true : undefined}
                className={cn(formControlClass, "mt-1 font-mono")}
                placeholder="[[2,7,11,15], 9]"
              />
              {inputError && (
                <span role="alert" className={formErrorClass}>
                  {inputError.message}
                </span>
              )}
            </label>
            <label className="text-sm font-semibold">
              Expected Output
              <input
                type="text"
                {...register(`test_cases.${index}.expected_output`)}
                aria-invalid={outputError ? true : undefined}
                className={cn(formControlClass, "mt-1 font-mono")}
                placeholder="[0,1]"
              />
              {outputError && (
                <span role="alert" className={formErrorClass}>
                  {outputError.message}
                </span>
              )}
            </label>
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className={cn(dangerFormButtonClass, "mt-5")}
              >
                Delete
              </button>
            )}
          </div>
        );
      })}

      <p className={formHintClass}>
        Input is a JSON array of function arguments. A single parameter still
        uses an array, for example [121].
      </p>
    </div>
  );
}
