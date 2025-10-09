import React, { FC, memo } from 'react';
import { FileText, Minimize2 } from 'lucide-react';
import { useFullscreen } from '@/contexts/FullscreenContext';

interface ProblemDetailsPaneProps {
  isExpanded: boolean;
  title: string;
  description: string;
  examples: string;
  constraints: string;
  testCases?: Array<{
    input: (string | number | boolean)[];
    output: string | number | boolean;
  }>;
  onToggle: () => void;
}

export const ProblemDetailsPane: FC<ProblemDetailsPaneProps> = memo(
  ({ isExpanded, description, examples, constraints, testCases, onToggle }) => {
    const { isFullscreen } = useFullscreen();
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
      <div className={`rounded-lg overflow-auto ${isFullscreen ? 'p-3' : ''}`}>
        <div className="py-2 border-b flex justify-between items-center">
          <span className="font-medium">Problem Details</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggle}
              className="p-1 hover:text-[hsl(var(--muted-foreground))] rounded-md transition-colors cursor-pointer"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 py-4">
          <div>
            <h2 className="text-xl font-medium mb-2">Problem Description</h2>
            <p className="whitespace-pre-line font-medium">{description}</p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Examples</h3>
            <pre className="p-3 rounded whitespace-pre-wrap bg-[hsl(var(--muted))] font-medium">
              {examples}
            </pre>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Constraints</h3>
            <pre className="p-3 rounded whitespace-pre-wrap bg-[hsl(var(--muted))] font-medium">
              {constraints}
            </pre>
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
