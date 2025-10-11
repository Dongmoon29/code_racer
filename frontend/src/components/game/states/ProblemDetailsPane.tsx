import React, { FC, memo } from 'react';
import { FileText, Minimize2 } from 'lucide-react';

interface IOSchema {
  param_types: string | string[]; // Can come as JSON string from backend
  return_type: string;
}

// Type-based value formatting function
const formatTestCaseValue = (
  value: string,
  type: string
): { formatted: string; isQuoted: boolean } => {
  try {
    // Try JSON parsing
    const parsed = JSON.parse(value);

    // Handle by type
    switch (type.toLowerCase()) {
      case 'number':
      case 'int':
      case 'integer':
      case 'float':
      case 'double':
        return { formatted: String(parsed), isQuoted: false };

      case 'boolean':
      case 'bool':
        return { formatted: String(parsed), isQuoted: false };

      case 'string':
      case 'str':
        return { formatted: String(parsed), isQuoted: true };

      case 'array':
      case 'list':
      case 'int[]':
      case 'number[]':
      case 'string[]':
      case 'boolean[]':
        return { formatted: JSON.stringify(parsed), isQuoted: false };

      case 'object':
      case 'dict':
        return { formatted: JSON.stringify(parsed), isQuoted: false };

      default:
        // Return original value when type is not specified
        return { formatted: value, isQuoted: true };
    }
  } catch {
    // Return original value when JSON parsing fails
    return { formatted: value, isQuoted: true };
  }
};

// Helper function to convert IOSchema param_types to array
const parseParamTypes = (paramTypes: string | string[]): string[] => {
  if (Array.isArray(paramTypes)) {
    return paramTypes;
  }

  try {
    const parsed = JSON.parse(paramTypes);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const parseTestCaseInput = (
  input: string,
  paramTypes: string[]
): { formatted: string; isQuoted: boolean } => {
  try {
    const parsed = JSON.parse(input);

    if (paramTypes.length <= 1) {
      const type = paramTypes[0] || 'unknown';
      return formatTestCaseValue(input, type);
    }

    if (Array.isArray(parsed)) {
      const formattedParams = parsed.map((param, index) => {
        const type = paramTypes[index] || 'unknown';
        const formatted = formatTestCaseValue(JSON.stringify(param), type);
        return formatted.isQuoted
          ? `"${formatted.formatted}"`
          : formatted.formatted;
      });

      return {
        formatted: formattedParams.join(', '),
        isQuoted: false,
      };
    }

    // Non-array case - process as original
    return formatTestCaseValue(input, paramTypes[0] || 'unknown');
  } catch {
    // Return original value when parsing fails
    return { formatted: input, isQuoted: true };
  }
};

interface ProblemDetailsPaneProps {
  isExpanded: boolean;
  title: string;
  description: string;
  examples: Array<{
    id: string;
    problem_id: string;
    input: string;
    output: string;
    explanation: string;
  }>;
  constraints: string;
  testCases?: Array<{
    input: string;
    expected_output: string;
  }>;
  ioSchema?: IOSchema;
  onToggle: () => void;
}

export const ProblemDetailsPane: FC<ProblemDetailsPaneProps> = memo(
  ({
    isExpanded,
    description,
    examples,
    constraints,
    testCases,
    ioSchema,
    onToggle,
  }) => {
    if (!isExpanded) {
      return (
        <button
          onClick={onToggle}
          className="w-full h-10 flex items-center justify-center text-[hsl(var(--muted-foreground))] rounded-lg hover:text-white hover:scale-110 transition-all duration-200"
          title="Show Problem Details"
        >
          <FileText className="w-6 h-6" />
        </button>
      );
    }

    return (
      <div className="border rounded-lg min-w-0 h-full flex flex-col">
        <div className="bg-[hsl(var(--muted))] px-4 py-2 flex items-center justify-between">
          <span className="font-medium truncate">Problem Details</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggle}
              className="cursor-pointer p-1 hover:text-[hsl(var(--muted-foreground))] rounded-md transition-colors shrink-0"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="h-[calc(100%-40px)] overflow-auto p-4">
          <div className={`space-y-4 `}>
            <div>
              <h2 className="text-xl font-medium mb-2">Problem Description</h2>
              <p className="whitespace-pre-line text-xs">{description}</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Examples</h3>
              {examples && examples.length > 0 ? (
                <div className="space-y-3">
                  {examples.map((example, index) => (
                    <div
                      key={example.id || index}
                      className="p-3 rounded text-xs"
                    >
                      <div className="font-medium mb-1">
                        Example {index + 1}:
                      </div>
                      <div className="mb-1">
                        <span className="font-medium">Input:</span>{' '}
                        {example.input}
                      </div>
                      <div className="mb-1">
                        <span className="font-medium">Output:</span>{' '}
                        {example.output}
                      </div>
                      {example.explanation && (
                        <div>
                          <span className="font-medium">Explanation:</span>{' '}
                          {example.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded text-xs">No examples available</div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Constraints</h3>
              <pre className="p-3 rounded whitespace-pre-wrap text-xs font-medium">
                {constraints}
              </pre>
            </div>
          </div>

          {/* Test Cases Section */}
          {testCases && testCases.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Test Cases</h3>
              <div className="space-y-3">
                {testCases.map((testCase, index) => {
                  const paramTypes = ioSchema
                    ? parseParamTypes(ioSchema.param_types)
                    : [];
                  const outputType = ioSchema?.return_type || 'unknown';

                  // Format values
                  const inputFormatted = parseTestCaseInput(
                    testCase.input,
                    paramTypes
                  );
                  const outputFormatted = formatTestCaseValue(
                    testCase.expected_output,
                    outputType
                  );

                  return (
                    <div
                      key={index}
                      className="p-3 rounded bg-[hsl(var(--muted))]"
                    >
                      <div className="mb-2">
                        <span className="font-medium text-sm text-[hsl(var(--muted-foreground))]">
                          Test Case {index + 1}:
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Input: </span>
                          <code className="ml-2 px-2 py-1 rounded bg-[hsl(var(--background))] text-[hsl(var(--foreground))] whitespace-pre-wrap">
                            {inputFormatted.isQuoted
                              ? `"${inputFormatted.formatted}"`
                              : inputFormatted.formatted}
                          </code>
                        </div>
                        <div>
                          <span className="font-medium">Expected Output: </span>
                          <code className="ml-2 px-2 py-1 rounded bg-[hsl(var(--background))] text-[hsl(var(--foreground))] whitespace-pre-wrap">
                            {outputFormatted.isQuoted
                              ? `"${outputFormatted.formatted}"`
                              : outputFormatted.formatted}
                          </code>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ProblemDetailsPane.displayName = 'ProblemDetailsPane';
