import { FC, useState } from 'react';
import { SubmissionProgress, TestCaseResult } from '@/types/websocket';
import { TestCase, IOSchema } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface TestCaseDisplayProps {
  submissionProgress: SubmissionProgress;
  testCases: TestCase[]; // Test case data (required)
  ioSchema?: IOSchema; // IO schema for parameter parsing
  className?: string;
  compact?: boolean;
}

export const TestCaseDisplay: FC<TestCaseDisplayProps> = ({
  submissionProgress,
  testCases,
  ioSchema,
  className = '',
  compact = false,
}) => {
  const { isSubmitting, totalTestCases, completedTestCases, testCaseResults } =
    submissionProgress;

  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);

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

  // Computed class names and values
  const containerClass = `space-y-3 ${className} ${
    compact ? 'max-h-80 overflow-auto' : ''
  }`;
  const cardPadding = compact ? 'p-3' : 'p-4';
  const statusTextSize = compact ? 'text-sm' : '';
  const counterTextSize = compact ? 'text-xs' : 'text-sm';

  // Computed status text
  const getStatusText = () => {
    if (isSubmitting) return 'Evaluating Solution...';
    if (completedTestCases > 0) return 'Evaluation Complete';
    return 'Ready to Evaluate';
  };

  const renderTestCaseTabContent = (
    result: TestCaseResult | undefined,
    testCase: TestCase,
    index: number
  ) => {
    // Set default values when execution result is not available
    const defaultResult: TestCaseResult = {
      index,
      input: testCase.input,
      expectedOutput: testCase.expected_output,
      status: 'pending',
    };
    const testResult = result || defaultResult;

    const paramTypes = ioSchema ? parseParamTypes(ioSchema.param_types) : [];

    // Parse input into individual parameters
    const parseInputParams = () => {
      if (!ioSchema || paramTypes.length === 0) {
        return [{ name: 'input', value: testCase.input }];
      }

      try {
        const parsed = JSON.parse(testCase.input);
        if (Array.isArray(parsed) && paramTypes.length > 1) {
          return parsed.map((param, idx) => {
            const type = paramTypes[idx] || 'unknown';
            const formatted = formatTestCaseValue(JSON.stringify(param), type);
            return {
              name: `param${idx + 1}`,
              value: formatted.isQuoted
                ? `"${formatted.formatted}"`
                : formatted.formatted,
            };
          });
        } else {
          const type = paramTypes[0] || 'unknown';
          const formatted = formatTestCaseValue(testCase.input, type);
          return [
            {
              name: 'input',
              value: formatted.isQuoted
                ? `"${formatted.formatted}"`
                : formatted.formatted,
            },
          ];
        }
      } catch {
        return [{ name: 'input', value: testCase.input }];
      }
    };

    const inputParams = parseInputParams();
    const outputType = ioSchema?.return_type || 'unknown';
    const outputFormatted = formatTestCaseValue(
      testCase.expected_output,
      outputType
    );
    const expectedOutput = outputFormatted.isQuoted
      ? `"${outputFormatted.formatted}"`
      : outputFormatted.formatted;

    const formatValue = (value: unknown): string => {
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      if (Array.isArray(value)) {
        return `[${value.map((v) => formatValue(v)).join(', ')}]`;
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    };

    return (
      <div className="space-y-4">
        {/* Input Parameters */}
        <div className="space-y-3">
          {inputParams.map((param, idx) => (
            <div key={idx}>
              <label className="text-xs font-medium text-[var(--gray-11)] mb-1.5 block">
                {param.name} =
              </label>
              <div className="px-3 py-2 rounded-md bg-[var(--gray-3)] border border-[var(--gray-6)] font-mono text-sm text-[var(--color-text)]">
                {param.value}
              </div>
            </div>
          ))}
        </div>

        {/* Expected Output */}
        <div>
          <label className="text-xs font-medium text-[var(--gray-11)] mb-1.5 block">
            Expected Output =
          </label>
          <div className="px-3 py-2 rounded-md bg-[var(--gray-3)] border border-[var(--gray-6)] font-mono text-sm text-[var(--color-text)]">
            {expectedOutput}
          </div>
        </div>

        {/* Actual Output (if available) */}
        {testResult.status === 'completed' &&
          testResult.actualOutput !== undefined && (
            <div>
              <label className="text-xs font-medium text-[var(--gray-11)] mb-1 block">
                Actual Output =
              </label>
              <div
                className={cn(
                  'px-3 py-2 rounded-md border font-mono text-sm',
                  testResult.passed
                    ? 'bg-[var(--green-3)] border-[var(--green-7)] text-[var(--green-11)]'
                    : 'bg-[var(--red-3)] border-[var(--red-7)] text-[var(--red-11)]'
                )}
              >
                {formatValue(testResult.actualOutput)}
              </div>
            </div>
          )}

        {/* Status and Metrics */}
        {testResult.status === 'completed' && (
          <div className="flex items-center justify-between pt-2 border-t border-[var(--gray-6)]">
            <div className="flex items-center gap-2">
              {testResult.passed ? (
                <span className="text-[var(--green-11)] font-bold">✓ Passed</span>
              ) : (
                <span className="text-[var(--red-11)] font-bold">✗ Failed</span>
              )}
            </div>
            <div className="text-xs text-[var(--gray-11)]">
              {testResult.executionTime && (
                <span>{(testResult.executionTime * 1000).toFixed(2)}ms</span>
              )}
              {testResult.memoryUsage && (
                <span className="ml-2">
                  {(testResult.memoryUsage / 1024).toFixed(2)}KB
                </span>
              )}
            </div>
          </div>
        )}

        {testResult.status === 'running' && (
          <div className="flex items-center gap-2 pt-2 border-t border-[var(--gray-6)]">
            <Spinner size="sm" className="text-[var(--accent-9)]" />
            <span className="text-xs text-[var(--gray-11)]">Running...</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={containerClass}>
      {/* Submission status header */}
      <Card variant="ghost" className={compact ? 'px-2 py-1.5' : 'px-4 py-2'}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSubmitting ? (
              <Spinner size="sm" className="text-[var(--accent-9)]" />
            ) : (
              <span className="text-[var(--green-11)] font-bold">✓</span>
            )}
            <span className={`${statusTextSize} font-medium`}>
              {getStatusText()}
            </span>
          </div>
          <div className={counterTextSize}>
            {completedTestCases} / {totalTestCases} test cases
          </div>
        </div>
      </Card>

      {/* Content */}
      <>
        {/* Submission in progress */}
        {isSubmitting && (
          <Alert variant="info" className={cardPadding}>
            <div className="text-sm">
              Evaluating your solution... Please wait.
            </div>
          </Alert>
        )}

        {!isSubmitting && completedTestCases > 0 && (
          <Alert
            variant={submissionProgress.overallPassed ? 'success' : 'error'}
            className={`${compact ? 'p-2' : 'p-4'}`}
          >
            <div className="flex items-center justify-between">
              <span className={`${compact ? 'text-sm' : ''} font-medium`}>
                {submissionProgress.statusMessage ||
                  (submissionProgress.overallPassed
                    ? 'All test cases passed!'
                    : 'test cases failed.')}
              </span>
            </div>
          </Alert>
        )}

        {/* Test case results - render based on test cases */}
        {testCases.length > 0 && (
          <Card variant="ghost" className={cardPadding}>
            {/* Test Case Tabs */}
            <div className="mb-4 border-b border-[var(--gray-6)] pb-2">
              <div className="flex flex-wrap items-center justify-center gap-1">
                {testCases.map((testCase, index) => {
                  const result = testCaseResults.find((r) => r.index === index);
                  const isActive = activeTestCaseIndex === index;
                  const isPassed =
                    result?.status === 'completed' && result?.passed;
                  const isFailed =
                    result?.status === 'completed' && !result?.passed;
                  const isRunning = result?.status === 'running';

                  return (
                    <button
                      key={index}
                      onClick={() => setActiveTestCaseIndex(index)}
                      className={cn(
                        'px-2.5 py-1.5 text-xs font-medium transition-colors relative cursor-pointer whitespace-nowrap shrink-0',
                        'border-b-2 border-transparent',
                        isActive
                          ? 'text-[var(--color-text)] border-[var(--accent-9)]'
                          : 'text-[var(--gray-11)] hover:text-[var(--color-text)]'
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {isRunning && (
                          <Spinner
                            size="sm"
                            className="w-3 h-3 text-[var(--accent-9)] shrink-0"
                          />
                        )}
                        {isPassed && (
                          <span className="text-[var(--green-11)] text-xs shrink-0">
                            ✓
                          </span>
                        )}
                        {isFailed && (
                          <span className="text-[var(--red-11)] text-xs shrink-0">
                            ✗
                          </span>
                        )}
                        {!isRunning && !isPassed && !isFailed && (
                          <span className="text-[var(--gray-9)] text-xs shrink-0">
                            ○
                          </span>
                        )}
                        <span>Case {index + 1}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Test Case Content */}
            {testCases[activeTestCaseIndex] && (
              <div>
                {(() => {
                  const testCase = testCases[activeTestCaseIndex];
                  const result = testCaseResults.find(
                    (r) => r.index === activeTestCaseIndex
                  );
                  return renderTestCaseTabContent(
                    result,
                    testCase,
                    activeTestCaseIndex
                  );
                })()}
              </div>
            )}
          </Card>
        )}
      </>
    </div>
  );
};

export default TestCaseDisplay;
