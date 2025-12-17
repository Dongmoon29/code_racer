import React, { FC, memo, useEffect, useState } from 'react';
import { FileText, Minimize2, CheckCircle2, Loader2 } from 'lucide-react';
import { ProblemDetailsTabs } from './ProblemDetailsTabs';
import TestCaseDisplay from '../TestCaseDisplay';
import { SubmissionProgress } from '@/types/websocket';

interface IOSchema {
  param_types: string | string[]; // Can come as JSON string from backend
  return_type: string;
}

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
  submissionProgress?: SubmissionProgress;
  onToggle: () => void;
}

export const ProblemDetailsPane: FC<ProblemDetailsPaneProps> = memo(
  ({
    isExpanded,
    title,
    description,
    examples,
    constraints,
    testCases,
    ioSchema,
    submissionProgress,
    onToggle,
  }) => {
    const [activeTab, setActiveTab] = useState<'description' | 'test-results'>(
      'description'
    );

    const isEvaluating = submissionProgress?.isSubmitting;

    // Automatically switch to "Test Results" tab when evaluation starts
    useEffect(() => {
      if (!submissionProgress) return;
      if (submissionProgress.isSubmitting) {
        setActiveTab('test-results');
      }
    }, [submissionProgress]);

    if (!isExpanded) {
      return (
        <button
          onClick={onToggle}
          className="w-full h-10 flex items-center justify-center text-[var(--gray-11)] rounded-lg hover:text-[var(--color-text)] hover:bg-[var(--gray-4)] hover:scale-110 transition-all duration-200"
          title="Show Problem Details"
        >
          <FileText className="w-6 h-6" />
        </button>
      );
    }

    const tabs = [
      {
        id: 'description',
        label: 'Description',
        icon: FileText,
      },
      {
        id: 'test-results',
        label: 'Test Results',
        icon: isEvaluating ? Loader2 : CheckCircle2,
        isLoading: !!isEvaluating,
      },
    ];

    return (
      <div className="border rounded-lg min-w-0 h-full flex flex-col">
        {/* Header with title and minimize button */}
        <div className="bg-[var(--gray-3)] px-4 py-2 flex items-center justify-between border-b border-[var(--gray-6)] rounded-t-lg shrink-0">
          <span className="font-medium truncate text-[var(--color-text)]">
            {title}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggle}
              className="cursor-pointer p-1 text-[var(--gray-11)] hover:text-[var(--color-text)] hover:bg-[var(--gray-4)] rounded-md transition-colors shrink-0"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <ProblemDetailsTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) =>
            setActiveTab(tabId as 'description' | 'test-results')
          }
        >
          {activeTab === 'description' ? (
            <div className="p-4 space-y-4 h-full">
              <div>
                <h2 className="text-xl font-medium mb-2">
                  Problem Description
                </h2>
                <p className="whitespace-pre-line text-sm font-light">
                  {description}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Examples</h3>
                {examples && examples.length > 0 ? (
                  <div className="space-y-3">
                    {examples.map((example, index) => (
                      <div
                        key={example.id || index}
                        className="p-3 rounded text-sm"
                      >
                        <div className="font-medium mb-1">
                          Example {index + 1}:
                        </div>
                        <div className="mb-1 font-light">
                          <span className="font-medium">Input:</span>{' '}
                          {example.input}
                        </div>
                        <div className="mb-1 font-light">
                          <span className="font-medium">Output:</span>{' '}
                          {example.output}
                        </div>
                        {example.explanation && (
                          <div className="font-light">
                            <span className="font-medium">Explanation:</span>{' '}
                            {example.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded text-sm font-light">
                    No examples available
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Constraints</h3>
                <pre className="p-3 rounded whitespace-pre-wrap text-sm font-light">
                  {constraints}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-4 h-full">
              {submissionProgress && testCases ? (
                <TestCaseDisplay
                  submissionProgress={submissionProgress}
                  testCases={testCases}
                  ioSchema={ioSchema}
                  compact={false}
                />
              ) : (
                <div className="text-sm text-[var(--gray-11)] text-center py-8">
                  No test results yet. Run your solution to see results.
                </div>
              )}
            </div>
          )}
        </ProblemDetailsTabs>
      </div>
    );
  }
);

ProblemDetailsPane.displayName = 'ProblemDetailsPane';
