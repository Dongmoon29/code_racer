import React, { FC } from 'react';
import { SubmissionProgress, TestCaseResult } from '@/types/websocket';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/alert';
import { Card } from '@/components/ui/Card';

interface TestCaseDisplayProps {
  submissionProgress: SubmissionProgress;
  className?: string;
  compact?: boolean;
}

export const TestCaseDisplay: FC<TestCaseDisplayProps> = ({
  submissionProgress,
  className = '',
  compact = false,
}) => {
  const { isSubmitting, totalTestCases, completedTestCases, testCaseResults } =
    submissionProgress;

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

  const renderTestCaseResult = (result: TestCaseResult) => {
    // Computed class names for test case result
    const testCaseClass = compact ? 'p-2 rounded-md' : 'p-4 rounded-lg';
    const headerMargin = compact ? 'mb-1' : 'mb-2';
    const testCaseTextSize = compact ? 'text-sm' : '';
    const metricsTextSize = compact ? 'text-xs' : 'text-sm';
    const inputOutputPadding = compact ? 'p-2' : 'p-3';
    const inputOutputTextSize = compact ? 'text-xs' : 'text-sm';

    // Background color based on test result and theme compatibility
    const getBackgroundClass = () => {
      if (result.status === 'completed' && !result.passed) {
        // Failed test case - red background for both light and dark themes
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      }
      // Default background for other states
      return 'bg-card border-border';
    };
    const getStatusIcon = () => {
      switch (result.status) {
        case 'running':
          return <Spinner size="sm" className="text-blue-500" />;
        case 'completed':
          return result.passed ? (
            <span className="text-green-500 font-bold">✓</span>
          ) : (
            <span className="text-red-500 font-bold">✗</span>
          );
        case 'pending':
        default:
          return <span className="text-gray-400">○</span>;
      }
    };

    const formatValue = (value: unknown): string => {
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      if (Array.isArray(value)) {
        return `[${value.map(formatValue).join(', ')}]`;
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    };

    return (
      <div
        key={result.index}
        className={`${testCaseClass} ${getBackgroundClass()} transition-all duration-300`}
      >
        <div className={`flex items-center justify-between ${headerMargin}`}>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`${testCaseTextSize} font-medium`}>
              Test Case {result.index + 1}
            </span>
          </div>
          {result.status === 'completed' && (
            <div className={metricsTextSize}>
              {result.executionTime && (
                <span>{(result.executionTime * 1000).toFixed(2)}ms</span>
              )}
              {result.memoryUsage && (
                <span className="ml-2">
                  {(result.memoryUsage / 1024).toFixed(2)}KB
                </span>
              )}
            </div>
          )}
        </div>

        <div className={`space-y-2 ${inputOutputTextSize}`}>
          <div>
            <span className="font-medium">Input:</span>
            <div
              className={`mt-1 ${inputOutputPadding} rounded border font-mono`}
            >
              {formatValue(result.input)}
            </div>
          </div>

          <div>
            <span className="font-medium">Expected Output:</span>
            <div
              className={`mt-1 ${inputOutputPadding} rounded border font-mono`}
            >
              {formatValue(result.expectedOutput)}
            </div>
          </div>

          {result.status === 'completed' &&
            result.actualOutput !== undefined && (
              <div>
                <span className="font-medium">Actual Output:</span>
                <div
                  className={`mt-1 ${inputOutputPadding} rounded border font-mono`}
                >
                  {formatValue(result.actualOutput)}
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
          <div className={counterTextSize}>
            {completedTestCases} / {totalTestCases} test cases
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

      {/* Test case results */}
      {testCaseResults.length > 0 && (
        <div className={testCaseSpacing}>
          {testCaseResults.map(renderTestCaseResult)}
        </div>
      )}
    </div>
  );
};

export default TestCaseDisplay;
