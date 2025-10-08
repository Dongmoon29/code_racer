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
  console.log('TestCaseDisplay rendering');

  const renderTestCaseResult = (result: TestCaseResult) => {
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
        className={`${
          compact ? 'p-2 rounded-md' : 'p-4 rounded-lg'
        } border transition-all duration-300}`}
      >
        <div
          className={`flex items-center justify-between ${
            compact ? 'mb-1' : 'mb-2'
          }`}
        >
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`${compact ? 'text-sm' : ''} font-medium`}>
              Test Case {result.index + 1}
            </span>
          </div>
          {result.status === 'completed' && (
            <div className={`${compact ? 'text-xs' : 'text-sm'}`}>
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

        <div className={`space-y-2 ${compact ? 'text-xs' : 'text-sm'}`}>
          <div>
            <span className="font-medium">Input:</span>
            <div
              className={`mt-1 ${
                compact ? 'p-1 text-[10px]' : 'p-2 text-xs'
              } rounded border font-mono`}
            >
              {formatValue(result.input)}
            </div>
          </div>

          <div>
            <span className="font-medium">Expected Output:</span>
            <div
              className={`mt-1 ${
                compact ? 'p-1 text-[10px]' : 'p-2 text-xs'
              } rounded border font-mono`}
            >
              {formatValue(result.expectedOutput)}
            </div>
          </div>

          {result.status === 'completed' &&
            result.actualOutput !== undefined && (
              <div>
                <span className="font-medium ">Actual Output:</span>
                <div
                  className={`mt-1 ${
                    compact ? 'p-1 text-[10px]' : 'p-2 text-xs'
                  } rounded border font-mono`}
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
    <div
      className={`space-y-3 ${className} ${
        compact ? 'max-h-80 overflow-auto' : ''
      }`}
    >
      {/* 제출 상태 헤더 */}
      <Card className={`${compact ? 'p-2' : 'p-4'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSubmitting ? (
              <Spinner size="sm" className="text-blue-500" />
            ) : (
              <span className="text-green-500 font-bold">✓</span>
            )}
            <span className={`${compact ? 'text-sm' : ''} font-medium`}>
              {isSubmitting
                ? 'Evaluating Solution...'
                : completedTestCases > 0
                ? 'Evaluation Complete'
                : 'Ready to Evaluate'}
            </span>
          </div>
          <div className={`${compact ? 'text-xs' : 'text-sm'} `}>
            {completedTestCases} / {totalTestCases} test cases
          </div>
        </div>

        {/* 진행률 바 */}
        <div className={`${compact ? 'mt-2' : 'mt-3'}`}>
          <div className={`w-full rounded-full ${compact ? 'h-1.5' : 'h-2'}`}>
            <div
              className={`bg-blue-500 ${
                compact ? 'h-1.5' : 'h-2'
              } rounded-full transition-all duration-300`}
              style={{
                width: `${
                  totalTestCases > 0
                    ? (completedTestCases / totalTestCases) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      </Card>

      {/* 초기 안내 */}
      {!isSubmitting && completedTestCases === 0 && (
        <Alert variant="info" className={`${compact ? 'p-2' : 'p-3'}`}>
          <div className="text-sm">
            Ready. Press Run to evaluate your solution.
          </div>
        </Alert>
      )}

      {/* 전체 결과 요약 */}
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

      {/* 테스트 케이스 결과들 */}
      {testCaseResults.length > 0 && (
        <div className={`${compact ? 'space-y-2' : 'space-y-3'}`}>
          {testCaseResults.map(renderTestCaseResult)}
        </div>
      )}
    </div>
  );
};

export default TestCaseDisplay;
