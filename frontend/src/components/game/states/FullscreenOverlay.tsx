import React, { FC, memo, useState } from 'react';
import { ProblemDetailsPane } from './ProblemDetailsPane';
import { LeetCodeEditorSplit } from './CodeEditorSplitProps';
import TestCaseDisplay from '../TestCaseDisplay';
import { SubmissionProgress } from '@/types/websocket';

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
  problemExamples: string;
  problemConstraints: string;
  onCodeChange: (code: string) => void;
  onMaximizeToggle: (editor: 'my' | 'opponent') => void;
  onToggleDescription: () => void;
  onClose: () => void;
  isSinglePlayerMode?: boolean;
  onRun?: () => void;
  submissionProgress: SubmissionProgress;
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
    onCodeChange,
    onMaximizeToggle,
    onToggleDescription,
    onClose,
    isSinglePlayerMode = false,
    onRun,
    submissionProgress,
  }) => {
    const [isResizing, setIsResizing] = useState(false);
    const [fsSplitSizes, setFsSplitSizes] = useState<number[]>([50, 50]);

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

    return (
      <div className="fixed inset-0 z-[9999] flex flex-col">
        <div className="flex-1 flex min-h-0">
          <div
            className={`transition-all duration-300 border-r ${
              isDescriptionExpanded ? 'w-[33.333%]' : 'w-[40px]'
            } h-full flex flex-col`}
          >
            <div className="flex-1 min-h-0 overflow-auto">
              <ProblemDetailsPane
                isExpanded={isDescriptionExpanded}
                title={problemTitle}
                description={problemDescription}
                examples={problemExamples}
                constraints={problemConstraints}
                onToggle={onToggleDescription}
              />
            </div>

            {isDescriptionExpanded && (
              <div className="mt-3 p-4">
                <TestCaseDisplay
                  submissionProgress={submissionProgress}
                  compact
                />
              </div>
            )}
          </div>

          <div className="flex-1 p-2 min-h-0 overflow-hidden">
            <LeetCodeEditorSplit
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
              onFullscreenToggle={onClose}
              onRun={onRun}
              runDisabled={false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              isSinglePlayerMode={isSinglePlayerMode}
            />
          </div>
        </div>
      </div>
    );
  }
);

FullscreenOverlay.displayName = 'FullscreenOverlay';
