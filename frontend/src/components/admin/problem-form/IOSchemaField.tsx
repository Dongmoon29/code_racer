import type { IOSchema } from "@/types";
import {
  dangerFormButtonClass,
  formControlClass,
  formHintClass,
  formLabelClass,
  secondaryFormButtonClass,
} from "@/components/ui/FormPrimitives";
import { cn } from "@/lib/utils";

interface IOSchemaFieldProps {
  value: IOSchema;
  onChange: (schema: IOSchema) => void;
}

const schemaTypes = [
  "int",
  "int64",
  "float64",
  "bool",
  "string",
  "int[]",
  "int[][]",
  "string[]",
  "string[][]",
  "float64[]",
  "bool[]",
] as const;

export default function IOSchemaField({ value, onChange }: IOSchemaFieldProps) {
  const updateParam = (index: number, paramType: string) => {
    onChange({
      ...value,
      param_types: value.param_types.map((currentType, currentIndex) =>
        currentIndex === index ? paramType : currentType,
      ),
    });
  };

  const removeParam = (index: number) => {
    if (value.param_types.length > 1) {
      onChange({
        ...value,
        param_types: value.param_types.filter(
          (_, currentIndex) => currentIndex !== index,
        ),
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--gray-11)]">
          Function signature *
        </p>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...value,
              param_types: [...value.param_types, "int"],
            })
          }
          className={cn(secondaryFormButtonClass, "min-h-9 px-3")}
        >
          + Add Parameter
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <span className={formHintClass}>Parameter types (in order)</span>
          {value.param_types.map((paramType, index) => (
            <div
              key={index}
              className="flex gap-2 rounded-xl border border-[var(--gray-6)] bg-[var(--gray-2)]/40 p-2"
            >
              <select
                aria-label={`Parameter ${index + 1} type`}
                value={paramType}
                onChange={(event) => updateParam(index, event.target.value)}
                className={cn(formControlClass, "min-w-0 flex-1")}
                required
              >
                {schemaTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {value.param_types.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeParam(index)}
                  className={dangerFormButtonClass}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>

        <label className={formLabelClass}>
          Return type
          <select
            value={value.return_type}
            onChange={(event) =>
              onChange({ ...value, return_type: event.target.value })
            }
            className={cn(formControlClass, "mt-2")}
            required
          >
            {schemaTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
