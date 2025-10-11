import React, { FC, memo } from 'react';
import { FileText, Minimize2 } from 'lucide-react';

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
  onToggle: () => void;
}

export const ProblemDetailsPane: FC<ProblemDetailsPaneProps> = memo(
  ({ isExpanded, description, examples, constraints, testCases, onToggle }) => {
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
                {testCases.map((testCase, index) => (
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
                        <code className="px-2 py-1 rounded bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
                          {JSON.stringify(testCase.input)}
                        </code>
                      </div>
                      <div>
                        <span className="font-medium">Expected Output: </span>
                        <code className="px-2 py-1 rounded bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
                          {JSON.stringify(testCase.output)}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ProblemDetailsPane.displayName = 'ProblemDetailsPane';
