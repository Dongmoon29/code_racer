import { FC, memo, useCallback, useState, useRef } from 'react';
import { Game, SubmitResult } from '@/types';
import { SubmissionProgress } from '@/types/websocket';
import { useTheme } from 'next-themes';
import { ProblemDetailsPane } from './ProblemDetailsPane';
import { FullscreenOverlay } from './FullscreenOverlay';
import { ProblemEditorSplit } from './CodeEditorSplitProps';
import { useFullscreen } from '@/contexts/FullscreenContext';
import { useLofiPlayer } from '@/contexts/LofiPlayerContext';
import { LofiPlayer } from '@/components/ui/LofiPlayer';
import { ResizeHandle } from '../ResizeHandle';
import { useToast } from '@/components/ui/Toast';

interface PlayingGameProps {
  game: Game;
  myCode: string;
  opponentCode: string;
  opponentName?: string;
  selectedLanguage: 'python' | 'javascript' | 'go';
  submitResult: SubmitResult | null;
  isSubmitting: boolean;
  submissionProgress: SubmissionProgress;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: 'python' | 'javascript' | 'go') => void;
  onSubmitCode: () => void;
}

export const PlayingGame: FC<PlayingGameProps> = memo(
  ({
    game,
    myCode,
    opponentCode,
    opponentName,
    selectedLanguage,
    isSubmitting,
    submissionProgress,
    onCodeChange,
    onLanguageChange,
    onSubmitCode,
  }) => {
    const { theme } = useTheme();
    const { isFullscreen, toggleFullscreen } = useFullscreen();
    const { showMusicPlayer, setShowMusicPlayer, setIsMusicPlaying } =
      useLofiPlayer();
    const { showToast } = useToast();
    const [maximizedEditor, setMaximizedEditor] = useState<
      'my' | 'opponent' | null
    >(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
    const [sizesNormal, setSizesNormal] = useState<number[]>([50, 50]);
    const [isResizing, setIsResizing] = useState(false);
    const [problemPaneWidth, setProblemPaneWidth] = useState(25); // percentage
    const [isProblemPaneResizing, setIsProblemPaneResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement>(null);

    const isSinglePlayerMode = game.mode === 'single';

    const handleMaximizeToggle = useCallback((editor: 'my' | 'opponent') => {
      setMaximizedEditor((current) => (current === editor ? null : editor));
    }, []);

    const handleToggleDescription = useCallback(() => {
      setIsDescriptionExpanded((prev) => !prev);
    }, []);

    const handleToggleFullscreen = useCallback(async () => {
      if (!fullscreenContainerRef.current) return;

      try {
        await toggleFullscreen(fullscreenContainerRef.current);
      } catch (error) {
        showToast({
          title: 'Fullscreen Error',
          message: 'Failed to toggle fullscreen mode',
          variant: 'error',
        });
      }
    }, [toggleFullscreen, showToast]);

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

    // ESC key is handled automatically by browser fullscreen API
    // No manual ESC handler needed

    return (
      <div
        ref={fullscreenContainerRef}
        className="flex flex-col h-full overflow-hidden"
      >
        {!isFullscreen ? (
          <div
            ref={containerRef}
            className="flex-1 flex min-h-0 overflow-hidden game-editor-container"
            style={{ width: '100%' }}
          >
            {/* Problem Description Pane */}
            <div
              className={`h-full flex flex-col ${
                isDescriptionExpanded ? '' : 'w-[40px]'
              }`}
              style={{
                width: isDescriptionExpanded
                  ? `${problemPaneWidth}%`
                  : undefined,
                transition: isDescriptionExpanded ? 'none' : 'all 300ms',
              }}
            >
              <div className="flex-1 min-h-0 h-full overflow-hidden">
                <ProblemDetailsPane
                  isExpanded={isDescriptionExpanded}
                  title={game.problem.title}
                  description={game.problem.description}
                  examples={game.problem.examples}
                  constraints={game.problem.constraints}
                  testCases={game.problem.test_cases}
                  ioSchema={game.problem.io_schema}
                  submissionProgress={submissionProgress}
                  onToggle={handleToggleDescription}
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

            {/* Editor Panes */}
            <div className="flex-1 relative min-h-0 overflow-hidden">
              <ProblemEditorSplit
                myCode={myCode}
                opponentCode={opponentCode}
                opponentName={opponentName}
                selectedLanguage={selectedLanguage}
                theme={theme}
                maximizedEditor={maximizedEditor}
                isResizing={isResizing}
                sizesNormal={sizesNormal}
                showFullscreenButton={true}
                onCodeChange={onCodeChange}
                onLanguageChange={onLanguageChange}
                onFullscreenToggle={handleToggleFullscreen}
                onRun={onSubmitCode}
                runDisabled={isSubmitting}
                onDragStart={() => {
                  setIsResizing(true);
                  document.body.classList.add('resizing');
                }}
                onDragEnd={(sizes) => {
                  setIsResizing(false);
                  setSizesNormal(sizes);
                  document.body.classList.remove('resizing');
                }}
                isSinglePlayerMode={isSinglePlayerMode}
              />
              {/* Overlay during problem pane resize to prevent editor interference */}
              {isProblemPaneResizing && (
                <div className="absolute inset-0 bg-transparent pointer-events-none z-50" />
              )}
            </div>
          </div>
        ) : (
          <FullscreenOverlay
            myCode={myCode}
            opponentCode={isSinglePlayerMode ? '' : opponentCode}
            opponentName={isSinglePlayerMode ? '' : opponentName}
            selectedLanguage={selectedLanguage}
            theme={theme}
            maximizedEditor={isSinglePlayerMode ? null : maximizedEditor}
            isDescriptionExpanded={isDescriptionExpanded}
            problemTitle={game.problem.title}
            problemDescription={game.problem.description}
            problemExamples={game.problem.examples}
            problemConstraints={game.problem.constraints}
            problemTestCases={game.problem.test_cases}
            problemIOSchema={game.problem.io_schema}
            onCodeChange={onCodeChange}
            onLanguageChange={onLanguageChange}
            onMaximizeToggle={
              isSinglePlayerMode ? () => {} : handleMaximizeToggle
            }
            onToggleDescription={handleToggleDescription}
            onClose={handleToggleFullscreen}
            isSinglePlayerMode={isSinglePlayerMode}
            onRun={onSubmitCode}
            submissionProgress={submissionProgress}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Global LofiPlayer - always rendered to prevent unmounting */}
        {showMusicPlayer && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMusicPlayer(false)}
          />
        )}
        <div
          className={`fixed top-16 right-4 z-50 bg-[var(--color-panel)] border border-[var(--gray-6)] rounded-md shadow-lg w-64 transition-opacity overflow-hidden ${
            showMusicPlayer ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <LofiPlayer
            onPlayingChange={setIsMusicPlaying}
            onClose={() => setShowMusicPlayer(false)}
          />
        </div>
      </div>
    );
  }
);

PlayingGame.displayName = 'PlayingGame';
