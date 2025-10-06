import React, { FC, useCallback, useEffect, useState } from 'react';
import Split from 'react-split';
import { Spinner } from '../../ui';
import LanguageSelector from '../LanguageSelector';
import { Game, SubmitResult } from '@/types';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/alert';
import { ProblemDetailsPane } from './ProblemDetailsPane';
import { EditorPane } from './EditorPane';
import { FullscreenOverlay } from './FullscreenOverlay';
import { useFullscreen } from '@/contexts/FullscreenContext';

interface PlayingGameProps {
  game: Game;
  myCode: string;
  opponentCode: string;
  opponentName?: string;
  selectedLanguage: 'python' | 'javascript' | 'go';
  showMyCode: boolean;
  showOpponentCode: boolean;
  submitResult: SubmitResult | null;
  submitting: boolean;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: 'python' | 'javascript' | 'go') => void;
  onSubmitCode: () => void;
  onToggleMyCode: () => void;
  onToggleOpponentCode: () => void;
}

export const PlayingGame: FC<PlayingGameProps> = ({
  game,
  myCode,
  opponentCode,
  opponentName,
  selectedLanguage,
  submitResult,
  submitting,
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
      <div className="p-4 grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-12 md:col-span-8">
          <h1 className="text-2xl font-bold">{game.leetcode.title}</h1>
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
            disabled={submitting}
            className="w-full md:w-auto"
          >
            {submitting ? <Spinner size="sm" /> : 'Submit Solution'}
          </Button>
        </div>
      </div>

      {/* Submit Result Alert */}
      {submitResult && (
        <Alert
          variant={submitResult.success ? 'success' : 'error'}
          className="px-4 mb-4"
        >
          {submitResult.message}
        </Alert>
      )}

      {!isFullscreen ? (
        <div
          className="flex-1 px-4 py-4 flex min-h-0 game-editor-container"
          style={{ width: '100%' }}
        >
          {/* Problem Description Pane */}
          <div
            className={`transition-all duration-300 overflow-auto ${
              isDescriptionExpanded ? 'w-[33.333%]' : 'w-[40px]'
            }`}
          >
            <ProblemDetailsPane
              isExpanded={isDescriptionExpanded}
              title={game.leetcode.title}
              description={game.leetcode.description}
              examples={game.leetcode.examples}
              constraints={game.leetcode.constraints}
              onToggle={handleToggleDescription}
            />
          </div>

          {/* Editor Panes */}
          <div className="flex-1 ml-4">
            <Split
              className="flex w-full h-full"
              sizes={
                maximizedEditor === 'my'
                  ? [100, 0]
                  : maximizedEditor === 'opponent'
                  ? [0, 100]
                  : sizesNormal
              }
              minSize={0}
              gutterSize={6}
              snapOffset={0}
              dragInterval={1}
              cursor="col-resize"
              onDragStart={() => {
                setIsResizing(true);
                document.body.classList.add('resizing');
              }}
              onDragEnd={(sizes) => {
                setIsResizing(false);
                setSizesNormal(sizes as number[]);
                document.body.classList.remove('resizing');
              }}
              gutter={(index, dir) => {
                const g = document.createElement('div');
                g.className = `gutter gutter-${dir}`;
                g.style.cursor =
                  dir === 'horizontal' ? 'col-resize' : 'row-resize';
                if (dir === 'horizontal') {
                  g.style.width = '6px';
                }
                g.style.background = 'transparent';
                g.style.zIndex = '10';
                return g;
              }}
            >
              <EditorPane
                title="Me"
                code={myCode}
                language={selectedLanguage}
                theme={theme}
                isMinimized={maximizedEditor === 'opponent'}
                isResizing={isResizing}
                showFullscreenButton={true}
                onChange={onCodeChange}
                onFullscreenToggle={handleToggleFullscreen}
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
          </div>
        </div>
      ) : (
        <FullscreenOverlay
          myCode={myCode}
          opponentCode={opponentCode}
          opponentName={opponentName}
          selectedLanguage={selectedLanguage}
          theme={theme}
          maximizedEditor={maximizedEditor}
          isDescriptionExpanded={isDescriptionExpanded}
          problemTitle={game.leetcode.title}
          problemDescription={game.leetcode.description}
          problemExamples={game.leetcode.examples}
          problemConstraints={game.leetcode.constraints}
          onCodeChange={onCodeChange}
          onMaximizeToggle={handleMaximizeToggle}
          onToggleDescription={handleToggleDescription}
          onClose={handleToggleFullscreen}
        />
      )}
    </div>
  );
};
