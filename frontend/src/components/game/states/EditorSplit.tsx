import React, { FC, memo } from 'react';
import Split from 'react-split';
import { EditorPane } from './EditorPane';
import { useSplitConfig } from './hooks/useSplitConfig';

interface EditorSplitProps {
  myCode: string;
  opponentCode: string;
  opponentName?: string;
  selectedLanguage: 'python' | 'javascript' | 'go';
  theme?: string;
  maximizedEditor: 'my' | 'opponent' | null;
  isResizing: boolean;
  sizesNormal: number[];
  showFullscreenButton?: boolean;
  gutterSize?: number;
  onCodeChange: (code: string) => void;
  onMaximizeToggle: (editor: 'my' | 'opponent') => void;
  onFullscreenToggle?: () => void;
  onDragStart: () => void;
  onDragEnd: (sizes: number[]) => void;
  isSinglePlayerMode?: boolean;
}

export const EditorSplit: FC<EditorSplitProps> = memo(
  ({
    myCode,
    opponentCode,
    opponentName,
    selectedLanguage,
    theme,
    maximizedEditor,
    isResizing,
    sizesNormal,
    showFullscreenButton = false,
    gutterSize = 6,
    onCodeChange,
    onFullscreenToggle,
    onDragStart,
    onDragEnd,
    isSinglePlayerMode = false,
  }) => {
    const splitConfig = useSplitConfig(
      maximizedEditor,
      sizesNormal,
      gutterSize
    );

    return (
      <>
        {isSinglePlayerMode ? (
          // Single player mode - only show one editor
          <EditorPane
            title="Me"
            code={myCode}
            language={selectedLanguage}
            theme={theme}
            isMinimized={false}
            isResizing={false}
            showFullscreenButton={showFullscreenButton}
            onChange={onCodeChange}
            onFullscreenToggle={onFullscreenToggle}
          />
        ) : (
          // Multiplayer mode - show split editors
          <Split
            className="flex w-full h-full"
            direction="horizontal"
            {...splitConfig}
            onDragStart={onDragStart}
            onDragEnd={(sizes) => onDragEnd(sizes as number[])}
          >
            <EditorPane
              title="Me"
              code={myCode}
              language={selectedLanguage}
              theme={theme}
              isMinimized={maximizedEditor === 'opponent'}
              isResizing={isResizing}
              showFullscreenButton={showFullscreenButton}
              onChange={onCodeChange}
              onFullscreenToggle={onFullscreenToggle}
            />
            <EditorPane
              title={opponentName ?? ''}
              code={opponentCode}
              language={selectedLanguage}
              theme={theme}
              readOnly={true}
              isMinimized={maximizedEditor === 'my'}
              isResizing={isResizing}
            />
          </Split>
        )}
      </>
    );
  }
);

EditorSplit.displayName = 'EditorSplit';
