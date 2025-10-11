import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Spinner } from '../../ui';
import LanguageSelector from '../LanguageSelector';
import { Game, SubmitResult } from '@/types';
import { SubmissionProgress } from '@/types/websocket';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import { ProblemDetailsPane } from './ProblemDetailsPane';
import { FullscreenOverlay } from './FullscreenOverlay';
import { ProblemEditorSplit } from './CodeEditorSplitProps';
import { useFullscreen } from '@/contexts/FullscreenContext';
import TestCaseDisplay from '../TestCaseDisplay';

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
      <div className="flex flex-col h-screen">
        {/* Header */}
        {!isFullscreen && (
          <div className="grid grid-cols-12 gap-4 mb-4">
            <div className="col-span-12 md:col-span-8">
              <h1 className="text-2xl font-bold">{game.problem.title}</h1>
              <div className="flex items-center gap-4 mt-2">
                <LanguageSelector
                  selectedLanguage={selectedLanguage}
                  onChange={onLanguageChange}
                />
              </div>
            </div>
            <div className="col-span-12 md:col-span-4 flex justify-end items-start">
              <Button
                onClick={onSubmitCode}
                disabled={isSubmitting}
                className="w-full md:w-auto"
              >
                {isSubmitting ? <Spinner size="sm" /> : 'Submit Solution'}
              </Button>
            </div>
          </div>
        )}

        {/* Global submit banner removed: messages now shown in TestCaseDisplay */}

        {/* Compact Test Case Display under Problem Details (left pane) */}

        {!isFullscreen ? (
          <div
            className="flex-1 flex min-h-0 game-editor-container"
            style={{ width: '100%' }}
          >
            {/* Problem Description Pane */}
            <div
              className={`transition-all duration-300 ${
                isDescriptionExpanded ? 'w-[33.333%]' : 'w-[40px]'
              } h-full flex flex-col`}
            >
              <div className="flex-1 min-h-0 overflow-auto">
                <ProblemDetailsPane
                  isExpanded={isDescriptionExpanded}
                  title={game.problem.title}
                  description={game.problem.description}
                  examples={game.problem.examples}
                  constraints={game.problem.constraints}
                  testCases={game.problem.test_cases}
                  ioSchema={game.problem.io_schema}
                  onToggle={handleToggleDescription}
                />
              </div>

              {isDescriptionExpanded && (
                <div className="mt-3">
                  <TestCaseDisplay
                    submissionProgress={submissionProgress}
                    testCases={game.problem.test_cases}
                    ioSchema={game.problem.io_schema}
                    compact
                  />
                </div>
              )}
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
      </div>
    );
  }
);

PlayingGame.displayName = 'PlayingGame';
