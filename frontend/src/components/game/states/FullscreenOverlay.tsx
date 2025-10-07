import React, { FC, memo, useState } from 'react';
import { ProblemDetailsPane } from './ProblemDetailsPane';
import { EditorSplit } from './EditorSplit';

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
            className={`transition-all duration-300 overflow-auto border-r ${
              isDescriptionExpanded ? 'w-[33.333%]' : 'w-[40px]'
            }`}
          >
            <ProblemDetailsPane
              isExpanded={isDescriptionExpanded}
              title={problemTitle}
              description={problemDescription}
              examples={problemExamples}
              constraints={problemConstraints}
              onToggle={onToggleDescription}
            />
          </div>

          <div className="flex-1 p-2 min-h-0 overflow-hidden">
            {isSinglePlayerMode ? (
              // Single player mode - only show one editor
              <EditorSplit
                myCode={myCode}
                opponentCode=""
                opponentName=""
                selectedLanguage={selectedLanguage}
                theme={theme}
                maximizedEditor={null}
                isResizing={false}
                sizesNormal={[100]}
                showFullscreenButton={true}
                gutterSize={10}
                onCodeChange={onCodeChange}
                onMaximizeToggle={() => {}}
                onFullscreenToggle={onClose}
                onDragStart={() => {}}
                onDragEnd={() => {}}
                isSinglePlayerMode={true}
              />
            ) : (
              // Multiplayer mode - show split editors
              <EditorSplit
                myCode={myCode}
                opponentCode={opponentCode}
                opponentName={opponentName}
                selectedLanguage={selectedLanguage}
                theme={theme}
                maximizedEditor={maximizedEditor}
                isResizing={isResizing}
                sizesNormal={fsSplitSizes}
                showFullscreenButton={true}
                gutterSize={10}
                onCodeChange={onCodeChange}
                onMaximizeToggle={onMaximizeToggle}
                onFullscreenToggle={onClose}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
);

FullscreenOverlay.displayName = 'FullscreenOverlay';
