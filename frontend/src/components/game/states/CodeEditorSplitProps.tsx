import React, { FC, memo } from 'react';
import { EditorPane } from './EditorPane';
import { ResizeHandle } from '../ResizeHandle';
import { useLeetCodeResize } from './hooks/useLeetCodeResize';

interface CodeEditorSplitProps {
  myCode: string;
  opponentCode: string;
  opponentName?: string;
  selectedLanguage: 'python' | 'javascript' | 'go';
  theme?: string;
  maximizedEditor: 'my' | 'opponent' | null;
  isResizing: boolean;
  sizesNormal: number[];
  showFullscreenButton?: boolean;
  onCodeChange: (code: string) => void;
  onFullscreenToggle?: () => void;
  onRun?: () => void;
  runDisabled?: boolean;
  onDragStart: () => void;
  onDragEnd: (sizes: number[]) => void;
  isSinglePlayerMode?: boolean;
}

export const LeetCodeEditorSplit: FC<CodeEditorSplitProps> = memo(
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
    onCodeChange,
    onFullscreenToggle,
    onRun,
    runDisabled = false,
    onDragStart,
    onDragEnd,
    isSinglePlayerMode = false,
  }) => {
    const {
      sizes,
      isResizing: isLocalResizing,
      containerRef,
      handleResize,
      handleResizeStart,
      handleResizeEnd,
    } = useLeetCodeResize({
      initialSizes: sizesNormal,
      onSizesChange: onDragEnd,
    });

    const handleResizeStartWrapper = () => {
      onDragStart();
      handleResizeStart();
    };

    const handleResizeEndWrapper = () => {
      handleResizeEnd();
    };

    if (isSinglePlayerMode) {
      return (
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
          onRun={onRun}
          runDisabled={runDisabled}
        />
      );
    }

    if (maximizedEditor === 'my') {
      return (
        <EditorPane
          title="Me"
          code={myCode}
          language={selectedLanguage}
          theme={theme}
          isMinimized={false}
          isResizing={isResizing || isLocalResizing}
          showFullscreenButton={showFullscreenButton}
          onChange={onCodeChange}
          onFullscreenToggle={onFullscreenToggle}
          onRun={onRun}
          runDisabled={runDisabled}
        />
      );
    }

    if (maximizedEditor === 'opponent') {
      return (
        <EditorPane
          title={opponentName ?? ''}
          code={opponentCode}
          language={selectedLanguage}
          theme={theme}
          readOnly={true}
          isMinimized={false}
          isResizing={isResizing || isLocalResizing}
        />
      );
    }

    return (
      <div
        ref={containerRef}
        className="flex w-full h-full relative"
        style={{ willChange: isLocalResizing ? 'auto' : 'contents' }}
      >
        <div className="flex flex-col h-full" style={{ width: `${sizes[0]}%` }}>
          <EditorPane
            title="Me"
            code={myCode}
            language={selectedLanguage}
            theme={theme}
            isMinimized={false}
            isResizing={isResizing || isLocalResizing}
            showFullscreenButton={showFullscreenButton}
            onChange={onCodeChange}
            onFullscreenToggle={onFullscreenToggle}
            onRun={onRun}
            runDisabled={runDisabled}
          />
        </div>

        <ResizeHandle
          onResize={handleResize}
          onResizeStart={handleResizeStartWrapper}
          onResizeEnd={handleResizeEndWrapper}
          disabled={isResizing}
        />

        <div className="flex flex-col h-full" style={{ width: `${sizes[1]}%` }}>
          <EditorPane
            title={opponentName ?? ''}
            code={opponentCode}
            language={selectedLanguage}
            theme={theme}
            readOnly={true}
            isMinimized={false}
            isResizing={isResizing || isLocalResizing}
          />
        </div>

        {isLocalResizing && (
          <div className="absolute inset-0 bg-transparent pointer-events-none z-50" />
        )}
      </div>
    );
  }
);

LeetCodeEditorSplit.displayName = 'LeetCodeEditorSplit';
