import React, { FC, memo, useState } from 'react';
import { EditorPane } from './EditorPane';
import { ResizeHandle } from '../ResizeHandle';
import { useProblemResize } from './hooks/useProblemResize';
import { LofiPlayer } from '@/components/ui/LofiPlayer';

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
  onLanguageChange?: (language: 'python' | 'javascript' | 'go') => void;
  onFullscreenToggle?: () => void;
  onRun?: () => void;
  runDisabled?: boolean;
  onDragStart: () => void;
  onDragEnd: (sizes: number[]) => void;
  isSinglePlayerMode?: boolean;
}

export const ProblemEditorSplit: FC<CodeEditorSplitProps> = memo(
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
    onLanguageChange,
    onFullscreenToggle,
    onRun,
    runDisabled = false,
    onDragStart,
    onDragEnd,
    isSinglePlayerMode = false,
  }) => {
    const [showMusicPlayer, setShowMusicPlayer] = useState(false);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);

    const {
      sizes,
      isResizing: isLocalResizing,
      containerRef,
      handleResize,
      handleResizeStart,
      handleResizeEnd,
    } = useProblemResize({
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
        <>
          <EditorPane
            title="Me"
            code={myCode}
            language={selectedLanguage}
            theme={theme}
            isMinimized={false}
            isResizing={false}
            showFullscreenButton={showFullscreenButton}
            showMusicButton={true}
            isMusicPlaying={isMusicPlaying}
            showLanguageSelector={true}
            onLanguageChange={onLanguageChange}
            onChange={onCodeChange}
            onFullscreenToggle={onFullscreenToggle}
            onRun={onRun}
            runDisabled={runDisabled}
            onMusicToggle={() => setShowMusicPlayer(!showMusicPlayer)}
          />
          {showMusicPlayer && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMusicPlayer(false)}
            />
          )}
          <div
            className={`fixed top-16 right-4 z-50 bg-[hsl(var(--card))] border rounded-lg shadow-lg w-64 transition-opacity ${
              showMusicPlayer ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <LofiPlayer
              onPlayingChange={setIsMusicPlaying}
              onClose={() => setShowMusicPlayer(false)}
            />
          </div>
        </>
      );
    }

    if (maximizedEditor === 'my') {
      return (
        <>
          <EditorPane
            title="Me"
            code={myCode}
            language={selectedLanguage}
            theme={theme}
            isMinimized={false}
            isResizing={isResizing || isLocalResizing}
            showFullscreenButton={showFullscreenButton}
            showMusicButton={true}
            isMusicPlaying={isMusicPlaying}
            showLanguageSelector={true}
            onLanguageChange={onLanguageChange}
            onChange={onCodeChange}
            onFullscreenToggle={onFullscreenToggle}
            onRun={onRun}
            runDisabled={runDisabled}
            onMusicToggle={() => setShowMusicPlayer(!showMusicPlayer)}
          />
          {showMusicPlayer && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMusicPlayer(false)}
            />
          )}
          <div
            className={`fixed top-16 right-4 z-50 bg-[hsl(var(--card))] border rounded-lg shadow-lg w-64 transition-opacity ${
              showMusicPlayer ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <LofiPlayer
              onPlayingChange={setIsMusicPlaying}
              onClose={() => setShowMusicPlayer(false)}
            />
          </div>
        </>
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
      <>
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
              showMusicButton={true}
              isMusicPlaying={isMusicPlaying}
              showLanguageSelector={true}
              onLanguageChange={onLanguageChange}
              onChange={onCodeChange}
              onFullscreenToggle={onFullscreenToggle}
              onRun={onRun}
              runDisabled={runDisabled}
              onMusicToggle={() => setShowMusicPlayer(!showMusicPlayer)}
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

        {/* Music Player - rendered outside editors to prevent unmounting */}
        <div
          className={`fixed top-16 right-4 z-50 bg-[hsl(var(--card))] border rounded-lg shadow-lg w-64 transition-opacity ${
            showMusicPlayer ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <LofiPlayer onPlayingChange={setIsMusicPlaying} />
        </div>
      </>
    );
  }
);

ProblemEditorSplit.displayName = 'ProblemEditorSplit';
