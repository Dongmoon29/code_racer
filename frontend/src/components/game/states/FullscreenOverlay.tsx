import React, { FC, memo, useState, useRef, useCallback } from 'react';
import { ProblemDetailsPane } from './ProblemDetailsPane';
import { ProblemEditorSplit } from './CodeEditorSplitProps';
import { SubmissionProgress } from '@/types/websocket';
import { ResizeHandle } from '../ResizeHandle';

interface IOSchema {
  param_types: string | string[]; // Can come as JSON string from backend
  return_type: string;
}

interface FullscreenOverlayProps {
  myCode: string;
  opponentCode: string;
  opponentName?: string;
  selectedLanguage: 'python' | 'javascript' | 'go';
  theme?: string;
  maximizedEditor: 'my' | 'opponent' | null;
  isDescriptionExpanded: boolean;
  problemTitle: string;
  problemDescription: string;
  problemExamples: Array<{
    id: string;
    problem_id: string;
    input: string;
    output: string;
    explanation: string;
  }>;
  problemConstraints: string;
  problemTestCases?: Array<{
    input: string;
    expected_output: string;
  }>;
  problemIOSchema?: IOSchema;
  onCodeChange: (code: string) => void;
  onLanguageChange?: (language: 'python' | 'javascript' | 'go') => void;
  onMaximizeToggle: (editor: 'my' | 'opponent') => void;
  onToggleDescription: () => void;
  onClose: () => void;
  isSinglePlayerMode?: boolean;
  onRun?: () => void;
  submissionProgress: SubmissionProgress;
  isSubmitting: boolean;
}

export const FullscreenOverlay: FC<FullscreenOverlayProps> = memo(
  ({
    myCode,
    opponentCode,
    opponentName,
    selectedLanguage,
    theme,
    maximizedEditor,
    isDescriptionExpanded,
    problemTitle,
    problemDescription,
    problemExamples,
    problemConstraints,
    problemTestCases,
    problemIOSchema,
    onCodeChange,
    onLanguageChange,
    onMaximizeToggle,
    onToggleDescription,
    onClose,
    isSinglePlayerMode = false,
    onRun,
    submissionProgress,
    isSubmitting,
  }) => {
    const [isResizing, setIsResizing] = useState(false);
    const [fsSplitSizes, setFsSplitSizes] = useState<number[]>([50, 50]);
    const [problemPaneWidth, setProblemPaneWidth] = useState(25); // percentage
    const [isProblemPaneResizing, setIsProblemPaneResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleDragStart = () => {
      if (maximizedEditor) {
        onMaximizeToggle(maximizedEditor);
      }
      setIsResizing(true);
      document.body.classList.add('resizing');
    };

    const handleDragEnd = (sizes: number[]) => {
      setIsResizing(false);
      setFsSplitSizes(sizes);
      document.body.classList.remove('resizing');
    };

    const handleProblemPaneResize = useCallback((deltaX: number) => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;

      setProblemPaneWidth((prevWidth) => {
        const newWidth = prevWidth + deltaPercent;
        // Min 15%, Max 40%
        return Math.max(15, Math.min(40, newWidth));
      });
    }, []);

    const handleProblemPaneResizeStart = useCallback(() => {
      setIsProblemPaneResizing(true);
      document.body.classList.add('resizing');
    }, []);

    const handleProblemPaneResizeEnd = useCallback(() => {
      setIsProblemPaneResizing(false);
      document.body.classList.remove('resizing');
    }, []);

    return (
      <div className="fixed inset-0 z-[9999] flex flex-col">
        <div ref={containerRef} className="flex-1 flex min-h-0">
          <div
            className={`h-full flex flex-col ${
              isDescriptionExpanded ? '' : 'w-[40px]'
            }`}
            style={{
              width: isDescriptionExpanded ? `${problemPaneWidth}%` : undefined,
              transition: isDescriptionExpanded ? 'none' : 'all 300ms',
            }}
          >
            <div className="flex-1 min-h-0 overflow-hidden p-2">
              <ProblemDetailsPane
                isExpanded={isDescriptionExpanded}
                title={problemTitle}
                description={problemDescription}
                examples={problemExamples}
                constraints={problemConstraints}
                testCases={problemTestCases}
                ioSchema={problemIOSchema}
                submissionProgress={submissionProgress}
                onToggle={onToggleDescription}
              />
            </div>
          </div>

          {/* Resize Handle for Problem Pane */}
          {isDescriptionExpanded && (
            <div className="flex items-center">
              <ResizeHandle
                onResize={handleProblemPaneResize}
                onResizeStart={handleProblemPaneResizeStart}
                onResizeEnd={handleProblemPaneResizeEnd}
              />
            </div>
          )}

          <div className="flex-1 p-2 min-h-0 overflow-hidden relative">
            <ProblemEditorSplit
              myCode={myCode}
              opponentCode={isSinglePlayerMode ? '' : opponentCode}
              opponentName={isSinglePlayerMode ? '' : opponentName}
              selectedLanguage={selectedLanguage}
              theme={theme}
              maximizedEditor={isSinglePlayerMode ? null : maximizedEditor}
              isResizing={isResizing}
              sizesNormal={isSinglePlayerMode ? [100, 0] : fsSplitSizes}
              showFullscreenButton={true}
              onCodeChange={onCodeChange}
              onLanguageChange={onLanguageChange}
              onFullscreenToggle={onClose}
              onRun={onRun}
              runDisabled={isSubmitting}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              isSinglePlayerMode={isSinglePlayerMode}
            />
            {/* Overlay during problem pane resize to prevent editor interference */}
            {isProblemPaneResizing && (
              <div className="absolute inset-0 bg-transparent pointer-events-none z-50" />
            )}
          </div>
        </div>
      </div>
    );
  }
);

FullscreenOverlay.displayName = 'FullscreenOverlay';
