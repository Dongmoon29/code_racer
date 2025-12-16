import { FC, useState } from 'react';
import { SubmissionProgress, TestCaseResult } from '@/types/websocket';
import { TestCase, IOSchema } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/Card';
import { ChevronDown, ChevronRight } from 'lucide-react';

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

  const [isMinimized, setIsMinimized] = useState(false);

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

  // Function to separate test case input by parameters
  const parseTestCaseInput = (
    input: string,
    paramTypes: string[]
  ): { formatted: string; isQuoted: boolean } => {
    try {
      const parsed = JSON.parse(input);

      // Single parameter case
      if (paramTypes.length <= 1) {
        const type = paramTypes[0] || 'unknown';
        return formatTestCaseValue(input, type);
      }

      // Multiple parameters case - separate and display each
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

  // Computed class names and values
  const containerClass = `space-y-3 ${className} ${
    compact ? 'max-h-80 overflow-auto' : ''
  }`;
  const cardPadding = compact ? 'p-2' : 'p-4';
  const statusTextSize = compact ? 'text-sm' : '';
  const counterTextSize = compact ? 'text-xs' : 'text-sm';
  const progressBarMargin = compact ? 'mt-2' : 'mt-3';
  const progressBarHeight = compact ? 'h-1.5' : 'h-2';
  const progressBarBgHeight = compact ? 'h-1.5' : 'h-2';
  const testCaseSpacing = compact ? 'space-y-2' : 'space-y-3';

  // Computed status text
  const getStatusText = () => {
    if (isSubmitting) return 'Evaluating Solution...';
    if (completedTestCases > 0) return 'Evaluation Complete';
    return 'Ready to Evaluate';
  };

  // Computed progress percentage
  const progressPercentage =
    totalTestCases > 0 ? (completedTestCases / totalTestCases) * 100 : 0;

  const renderTestCaseResult = (
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

    // Computed class names for test case result
    const testCaseClass = compact ? 'p-2 rounded-md' : 'p-4 rounded-lg';
    const headerMargin = compact ? 'mb-1' : 'mb-2';
    const testCaseTextSize = compact ? 'text-sm' : '';
    const metricsTextSize = compact ? 'text-xs' : 'text-sm';
    const inputOutputPadding = compact ? 'p-2' : 'p-3';
    const inputOutputTextSize = compact ? 'text-xs' : 'text-sm';

    // Background color based on test result and theme compatibility
    const getBackgroundClass = () => {
      if (testResult.status === 'completed' && !testResult.passed) {
        // Failed test case - red background for both light and dark themes
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      }
      // Default background for other states
      return 'bg-card border-border';
    };
    const getStatusIcon = () => {
      switch (testResult.status) {
        case 'running':
          return <Spinner size="sm" className="text-blue-500" />;
        case 'completed':
          return testResult.passed ? (
            <span className="text-green-500 font-bold">✓</span>
          ) : (
            <span className="text-red-500 font-bold">✗</span>
          );
        case 'pending':
        default:
          return <span className="text-gray-400">○</span>;
      }
    };

    const formatValue = (value: unknown, isInput: boolean = false): string => {
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';

      // Apply parameter separation for input values when IOSchema is available
      if (isInput && ioSchema) {
        const paramTypes = parseParamTypes(ioSchema.param_types);
        const inputFormatted = parseTestCaseInput(String(value), paramTypes);
        return inputFormatted.isQuoted
          ? `"${inputFormatted.formatted}"`
          : inputFormatted.formatted;
      }

      // Apply type-based formatting for output values
      if (!isInput && ioSchema) {
        const outputType = ioSchema.return_type || 'unknown';
        const outputFormatted = formatTestCaseValue(String(value), outputType);
        return outputFormatted.isQuoted
          ? `"${outputFormatted.formatted}"`
          : outputFormatted.formatted;
      }

      // Default formatting
      if (Array.isArray(value)) {
        return `[${value.map((v) => formatValue(v, false)).join(', ')}]`;
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    };

    return (
      <div
        key={testResult.index}
        className={`${testCaseClass} ${getBackgroundClass()} transition-all duration-300`}
      >
        <div className={`flex items-center justify-between ${headerMargin}`}>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`${testCaseTextSize} font-medium`}>
              Test Case {testResult.index + 1}
            </span>
          </div>
          {testResult.status === 'completed' && (
            <div className={metricsTextSize}>
              {testResult.executionTime && (
                <span>{(testResult.executionTime * 1000).toFixed(2)}ms</span>
              )}
              {testResult.memoryUsage && (
                <span className="ml-2">
                  {(testResult.memoryUsage / 1024).toFixed(2)}KB
                </span>
              )}
            </div>
          )}
        </div>

        <div className={`space-y-2 ${inputOutputTextSize}`}>
          {/* Input and Expected Output always use static data */}
          <div>
            <span className="font-medium">Input:</span>
            <div
              className={`mt-1 ${inputOutputPadding} rounded border font-mono`}
            >
              {formatValue(testCase.input, true)}
            </div>
          </div>

          <div>
            <span className="font-medium">Expected Output:</span>
            <div
              className={`mt-1 ${inputOutputPadding} rounded border font-mono`}
            >
              {formatValue(testCase.expected_output, false)}
            </div>
          </div>

          {/* Actual Output only uses execution results from WebSocket */}
          {testResult.status === 'completed' &&
            testResult.actualOutput !== undefined && (
              <div>
                <span className="font-medium">Actual Output:</span>
                <div
                  className={`mt-1 ${inputOutputPadding} rounded border font-mono`}
                >
                  {formatValue(testResult.actualOutput, false)}
                </div>
              </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className={containerClass}>
      {/* Submission status header */}
      <Card className={cardPadding}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSubmitting ? (
              <Spinner size="sm" className="text-blue-500" />
            ) : (
              <span className="text-green-500 font-bold">✓</span>
            )}
            <span className={`${statusTextSize} font-medium`}>
              {getStatusText()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={counterTextSize}>
              {completedTestCases} / {totalTestCases} test cases
            </div>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className={progressBarMargin}>
          <div className={`w-full rounded-full ${progressBarHeight}`}>
            <div
              className={`bg-blue-500 ${progressBarBgHeight} rounded-full transition-all duration-300`}
              style={{
                width: `${progressPercentage}%`,
              }}
            />
          </div>
        </div>
      </Card>

      {/* Content - only show when not minimized */}
      {!isMinimized && (
        <>
          {/* Initial guidance */}
          {!isSubmitting && completedTestCases === 0 && (
            <Alert variant="info" className={cardPadding}>
              <div className="text-sm">
                Ready. Press Run to evaluate your solution.
              </div>
            </Alert>
          )}

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
            <div className={testCaseSpacing}>
              {testCases.map((testCase, index) => {
                // Check if execution result exists for this index
                const result = testCaseResults.find((r) => r.index === index);
                return renderTestCaseResult(result, testCase, index);
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TestCaseDisplay;
