import React, { FC, memo, useState } from 'react';
import { Minimize2 } from 'lucide-react';
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
      <div className="fixed inset-0 z-[9999] bg-white dark:bg-black flex flex-col">
        {/* Floating exit button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 rounded-md bg-[hsl(var(--muted))] hover:bg-gray-200 transition-colors shadow z-50"
          title="Exit Fullscreen"
        >
          <Minimize2 className="w-4 h-4" />
        </button>

        <div className="flex-1 flex min-h-0">
          {/* Problem details (collapsible) */}
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

          {/* Editors with resizable splitter */}
          <div className="flex-1 p-2 min-h-0 overflow-hidden">
            <EditorSplit
              myCode={myCode}
              opponentCode={opponentCode}
              opponentName={opponentName}
              selectedLanguage={selectedLanguage}
              theme={theme}
              maximizedEditor={maximizedEditor}
              isResizing={isResizing}
              sizesNormal={fsSplitSizes}
              gutterSize={10}
              onCodeChange={onCodeChange}
              onMaximizeToggle={onMaximizeToggle}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          </div>
        </div>
      </div>
    );
  }
);

FullscreenOverlay.displayName = 'FullscreenOverlay';
