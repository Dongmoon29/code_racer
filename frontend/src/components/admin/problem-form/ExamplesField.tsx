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
  formLabelClass,
  secondaryFormButtonClass,
} from "@/components/ui/FormPrimitives";
import { cn } from "@/lib/utils";

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--gray-11)]">
          {fields.length} example{fields.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => append(emptyExample(), { shouldFocus: true })}
          className={cn(secondaryFormButtonClass, "min-h-9 px-3")}
        >
          + Add Example
        </button>
      </div>

      {fields.map((field, index) => {
        const inputError = errors.examples?.[index]?.input;
        const outputError = errors.examples?.[index]?.output;

        return (
          <div
            key={field.id}
            className="space-y-4 rounded-xl border border-[var(--gray-6)] bg-[var(--gray-2)]/40 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Example {index + 1}</span>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className={dangerFormButtonClass}
                >
                  Delete
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className={formLabelClass}>
                Input
                <textarea
                  {...register(`examples.${index}.input`)}
                  rows={2}
                  aria-invalid={inputError ? true : undefined}
                  className={cn(formControlClass, "mt-1 font-mono")}
                  placeholder="nums = [2,7,11,15], target = 9"
                />
                {inputError && (
                  <span role="alert" className={formErrorClass}>
                    {inputError.message}
                  </span>
                )}
              </label>
              <label className={formLabelClass}>
                Output
                <textarea
                  {...register(`examples.${index}.output`)}
                  rows={2}
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
            </div>

            <label className={formLabelClass}>
              Explanation (optional)
              <textarea
                {...register(`examples.${index}.explanation`)}
                rows={2}
                className={cn(formControlClass, "mt-1")}
                placeholder="Why this output is correct"
              />
            </label>
          </div>
        );
      })}
    </div>
  );
}
