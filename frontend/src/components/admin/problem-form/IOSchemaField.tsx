import type { IOSchema } from "@/types";

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
    <section className="space-y-3" aria-labelledby="signature-heading">
      <div className="flex items-center justify-between">
        <h3 id="signature-heading" className="text-sm font-medium">
          Function signature *
        </h3>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...value,
              param_types: [...value.param_types, "int"],
            })
          }
          className="rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
        >
          + Add Parameter
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <span className="block text-xs text-[var(--gray-10)]">
            Parameter types (in order)
          </span>
          {value.param_types.map((paramType, index) => (
            <div key={index} className="flex gap-2">
              <select
                aria-label={`Parameter ${index + 1} type`}
                value={paramType}
                onChange={(event) => updateParam(index, event.target.value)}
                className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="rounded border border-red-500 px-3 text-sm text-red-500 hover:bg-red-500/10"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>

        <label className="text-xs text-[var(--gray-10)]">
          Return type
          <select
            value={value.return_type}
            onChange={(event) =>
              onChange({ ...value, return_type: event.target.value })
            }
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-[initial] focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    </section>
  );
}
