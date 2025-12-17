import { FC, memo, useCallback, useEffect, useState } from 'react';
import { Game, SubmitResult } from '@/types';
import { SubmissionProgress } from '@/types/websocket';
import { useTheme } from 'next-themes';
import { ProblemDetailsPane } from './ProblemDetailsPane';
import { FullscreenOverlay } from './FullscreenOverlay';
import { ProblemEditorSplit } from './CodeEditorSplitProps';
import { useFullscreen } from '@/contexts/FullscreenContext';
import { useLofiPlayer } from '@/contexts/LofiPlayerContext';
import { LofiPlayer } from '@/components/ui/LofiPlayer';

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
    const { isFullscreen, setIsFullscreen } = useFullscreen();
    const { showMusicPlayer, setShowMusicPlayer, setIsMusicPlaying } =
      useLofiPlayer();
    const [maximizedEditor, setMaximizedEditor] = useState<
      'my' | 'opponent' | null
    >(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
    const [isFullscreenMy, setIsFullscreenMy] = useState(false);
    const [sizesNormal, setSizesNormal] = useState<number[]>([50, 50]);
    const [isResizing, setIsResizing] = useState(false);

    const isSinglePlayerMode = game.mode === 'single';

    const handleMaximizeToggle = useCallback((editor: 'my' | 'opponent') => {
      setMaximizedEditor((current) => (current === editor ? null : editor));
    }, []);

    const handleToggleDescription = useCallback(() => {
      setIsDescriptionExpanded((prev) => !prev);
    }, []);

    const handleToggleFullscreen = useCallback(() => {
      setIsFullscreenMy((prev) => !prev);
    }, []);

    // ESC to exit fullscreen
    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsFullscreenMy(false);
        }
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [setIsFullscreen]);

    // Sync local fullscreen toggle with global context
    useEffect(() => {
      setIsFullscreen(isFullscreenMy);
      return () => setIsFullscreen(false);
    }, [isFullscreenMy, setIsFullscreen]);

    return (
      <div className="flex flex-col h-full min-h-screen ">
        {!isFullscreen ? (
          <div
            className="flex-1 flex min-h-0 game-editor-container"
            style={{ width: '100%' }}
          >
            {/* Problem Description Pane */}
            <div
              className={`transition-all duration-300 ${
                isDescriptionExpanded ? 'w-[25%]' : 'w-[40px]'
              } h-full flex flex-col`}
            >
              <div className="flex-1 min-h-0 h-full">
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

            {/* Editor Panes */}
            <div className="flex-1 ml-4">
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
          className={`fixed top-16 right-4 z-50 bg-[hsl(var(--card))] border rounded-lg shadow-lg w-64 transition-opacity overflow-hidden ${
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
