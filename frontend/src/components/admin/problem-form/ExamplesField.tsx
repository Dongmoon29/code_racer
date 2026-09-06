import type { ExampleRequest } from "@/types";

interface ExamplesFieldProps {
  examples: ExampleRequest[];
  onChange: (examples: ExampleRequest[]) => void;
}

const emptyExample = (): ExampleRequest => ({
  input: "",
  output: "",
  explanation: "",
});

export default function ExamplesField({
  examples,
  onChange,
}: ExamplesFieldProps) {
  const updateExample = (
    index: number,
    field: keyof ExampleRequest,
    value: string,
  ) => {
    onChange(
      examples.map((example, currentIndex) =>
        currentIndex === index ? { ...example, [field]: value } : example,
      ),
    );
  };

  const removeExample = (index: number) => {
    if (examples.length > 1) {
      onChange(examples.filter((_, currentIndex) => currentIndex !== index));
    }
  };

  return (
    <section className="space-y-3" aria-labelledby="examples-heading">
      <div className="flex items-center justify-between">
        <h3 id="examples-heading" className="text-sm font-medium">
          Examples *
        </h3>
        <button
          type="button"
          onClick={() => onChange([...examples, emptyExample()])}
          className="rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
        >
          + Add Example
        </button>
      </div>

      {examples.map((example, index) => (
        <div key={index} className="space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Example {index + 1}</span>
            {examples.length > 1 && (
              <button
                type="button"
                onClick={() => removeExample(index)}
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
                value={example.input}
                onChange={(event) =>
                  updateExample(index, "input", event.target.value)
                }
                rows={2}
                className="mt-1 w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="nums = [2,7,11,15], target = 9"
                required
              />
            </label>
            <label className="text-xs">
              Output
              <textarea
                value={example.output}
                onChange={(event) =>
                  updateExample(index, "output", event.target.value)
                }
                rows={2}
                className="mt-1 w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="[0,1]"
                required
              />
            </label>
          </div>

          <label className="block text-xs">
            Explanation (optional)
            <textarea
              value={example.explanation}
              onChange={(event) =>
                updateExample(index, "explanation", event.target.value)
              }
              rows={2}
              className="mt-1 w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Why this output is correct"
            />
          </label>
        </div>
      ))}
    </section>
  );
}
