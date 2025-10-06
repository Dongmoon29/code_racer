import React, { FC, useEffect, useState } from 'react';
import { Spinner } from '../../ui';
import CodeEditor from '../CodeEditor';
import LanguageSelector from '../LanguageSelector';
import { Game, SubmitResult } from '@/types';
import { FileText, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/alert';

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
  const [maximizedEditor, setMaximizedEditor] = useState<
    'my' | 'opponent' | null
  >(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
  const [isFullscreenMy, setIsFullscreenMy] = useState(false);

  const handleMaximizeToggle = (editor: 'my' | 'opponent') => {
    setMaximizedEditor((current) => (current === editor ? null : editor));
  };

  // ESC to exit fullscreen and body scroll lock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreenMy(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = isFullscreenMy ? 'hidden' : prev || '';
    return () => {
      document.body.style.overflow = prev || '';
    };
  }, [isFullscreenMy]);

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

      <div
        className="flex-1 px-4 py-4 flex min-h-0 game-editor-container"
        style={{ width: '100%' }}
      >
        <div
          className={`
            transition-all duration-300 overflow-auto
            ${isDescriptionExpanded ? 'w-[33.333%]' : 'w-[40px]'}
          `}
        >
          {isDescriptionExpanded ? (
            <div className="bg-[hsl(var(--muted))] rounded-lg overflow-auto">
              <div className="px-4 py-2 border-b flex justify-between items-center">
                <span className="font-medium">Problem Details</span>
                <button
                  onClick={() => setIsDescriptionExpanded(false)}
                  className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                  title="Minimize"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 p-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    Problem Description
                  </h2>
                  <p className="whitespace-pre-line">
                    {game.leetcode.description}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Examples</h3>
                  <pre className="p-3 rounded whitespace-pre-wrap bg-[hsl(var(--muted))]">
                    {game.leetcode.examples}
                  </pre>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Constraints</h3>
                  <pre className="p-3 rounded whitespace-pre-wrap bg-[hsl(var(--muted))]">
                    {game.leetcode.constraints}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsDescriptionExpanded(true)}
              className="w-full h-10 flex items-center justify-center text-[hsl(var(--muted-foreground))] rounded-lg hover:text-white hover:scale-110 transition-all duration-200"
              title="Show Problem Details"
            >
              <FileText className="w-6 h-6" />
            </button>
          )}
        </div>
        <div className="flex-1 flex gap-4 ml-4">
          <div
            className={`
              transition-all duration-300 border border-gray-200 rounded-lg overflow-hidden
              ${
                maximizedEditor === 'opponent'
                  ? 'w-[40px]'
                  : maximizedEditor === 'my'
                  ? 'w-full'
                  : 'w-[calc(50%-0.5rem)]'
              }
            `}
          >
            <div
              className={`
              bg-[hsl(var(--muted))] px-4 py-2 border-b flex items-center
              ${
                maximizedEditor === 'opponent'
                  ? 'justify-center'
                  : 'justify-between'
              }
            `}
            >
              <span
                className={`font-medium truncate ${
                  maximizedEditor === 'opponent' ? 'hidden' : ''
                }`}
              >
                Me
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleMaximizeToggle('my')}
                  className="cursor-pointer p-1 hover:bg-gray-200 rounded-md transition-colors shrink-0"
                  title={maximizedEditor === 'my' ? 'Restore' : 'Maximize'}
                >
                  {maximizedEditor === 'my' ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsFullscreenMy((v) => !v)}
                  className="cursor-pointer p-1 hover:bg-gray-200 rounded-md transition-colors shrink-0"
                  title={isFullscreenMy ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreenMy ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <div
              className={`h-[calc(100%-40px)] overflow-auto ${
                maximizedEditor === 'opponent' ? 'hidden' : ''
              }`}
            >
              <CodeEditor
                value={myCode}
                onChange={onCodeChange}
                language={selectedLanguage}
                theme={theme}
              />
            </div>
          </div>

          <div
            className={`
              transition-all duration-300 border border-gray-200 rounded-lg overflow-hidden
              ${
                maximizedEditor === 'my'
                  ? 'w-[40px]'
                  : maximizedEditor === 'opponent'
                  ? 'w-full'
                  : 'w-[calc(50%-0.5rem)]'
              }
            `}
          >
            <div
              className={`
              bg-[hsl(var(--muted))] px-4 py-2 border-b flex items-center
              ${maximizedEditor === 'my' ? 'justify-center' : 'justify-between'}
            `}
            >
              <span
                className={`font-medium truncate ${
                  maximizedEditor === 'my' ? 'hidden' : ''
                }`}
              >
                {opponentName ?? ''}
              </span>
              <button
                onClick={() => handleMaximizeToggle('opponent')}
                className="p-1 hover:bg-gray-50 cursor-pointer rounded-md transition-colors shrink-0"
                title={maximizedEditor === 'opponent' ? 'Restore' : 'Maximize'}
              >
                {maximizedEditor === 'opponent' ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
            <div
              className={`h-[calc(100%-40px)] overflow-auto ${
                maximizedEditor === 'my' ? 'hidden' : ''
              }`}
            >
              <CodeEditor
                value={opponentCode}
                readOnly={true}
                language={selectedLanguage}
                theme={theme}
              />
            </div>
          </div>
        </div>
      </div>
      {isFullscreenMy && (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-black flex flex-col">
          {/* Floating exit button */}
          <button
            onClick={() => setIsFullscreenMy(false)}
            className="absolute top-2 right-2 p-2 rounded-md bg-[hsl(var(--muted))] hover:bg-gray-200 transition-colors shadow"
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
              {isDescriptionExpanded ? (
                <div className="h-full flex flex-col">
                  <div className="px-4 py-3 border-b flex justify-between items-center bg-[hsl(var(--muted))]">
                    <span className="font-medium">Problem Details</span>
                    <button
                      onClick={() => setIsDescriptionExpanded(false)}
                      className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                      title="Minimize"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-4 p-4">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">
                        Problem Description
                      </h2>
                      <p className="whitespace-pre-line">
                        {game.leetcode.description}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Examples</h3>
                      <pre className="p-3 rounded whitespace-pre-wrap bg-[hsl(var(--muted))]">
                        {game.leetcode.examples}
                      </pre>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Constraints
                      </h3>
                      <pre className="p-3 rounded whitespace-pre-wrap bg-[hsl(var(--muted))]">
                        {game.leetcode.constraints}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsDescriptionExpanded(true)}
                  className="w-full h-10 flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-white hover:scale-110 transition-all duration-200"
                  title="Show Problem Details"
                >
                  <FileText className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Editors side by side with maximize/minimize */}
            <div className="flex-1 flex gap-2 p-2 overflow-hidden">
              {/* My editor */}
              <div
                className={`transition-all duration-300 border rounded-lg overflow-hidden flex flex-col min-w-0 ${
                  maximizedEditor === 'opponent'
                    ? 'w-[40px]'
                    : maximizedEditor === 'my'
                    ? 'w-full'
                    : 'w-[calc(50%-0.5rem)]'
                }`}
              >
                <div
                  className={`h-10 px-4 py-2 border-b flex items-center ${
                    maximizedEditor === 'opponent'
                      ? 'justify-center'
                      : 'justify-between'
                  } bg-[hsl(var(--muted))]`}
                >
                  <span
                    className={`font-medium truncate ${
                      maximizedEditor === 'opponent' ? 'hidden' : ''
                    }`}
                  >
                    Me
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleMaximizeToggle('my')}
                      className="cursor-pointer p-1 hover:bg-gray-200 rounded-md transition-colors shrink-0"
                      title={maximizedEditor === 'my' ? 'Restore' : 'Maximize'}
                    >
                      {maximizedEditor === 'my' ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div
                  className={`flex-1 min-h-0 ${
                    maximizedEditor === 'opponent' ? 'hidden' : ''
                  }`}
                >
                  <CodeEditor
                    value={myCode}
                    onChange={onCodeChange}
                    language={selectedLanguage}
                    theme={theme}
                  />
                </div>
              </div>

              {/* Opponent editor */}
              <div
                className={`transition-all duration-300 border rounded-lg overflow-hidden flex flex-col min-w-0 ${
                  maximizedEditor === 'my'
                    ? 'w-[40px]'
                    : maximizedEditor === 'opponent'
                    ? 'w-full'
                    : 'w-[calc(50%-0.5rem)]'
                }`}
              >
                <div
                  className={`h-10 px-4 py-2 border-b flex items-center ${
                    maximizedEditor === 'my'
                      ? 'justify-center'
                      : 'justify-between'
                  } bg-[hsl(var(--muted))]`}
                >
                  <span
                    className={`font-medium truncate ${
                      maximizedEditor === 'my' ? 'hidden' : ''
                    }`}
                  >
                    {opponentName ?? ''}
                  </span>
                  <button
                    onClick={() => handleMaximizeToggle('opponent')}
                    className="p-1 hover:bg-gray-50 cursor-pointer rounded-md transition-colors shrink-0"
                    title={
                      maximizedEditor === 'opponent' ? 'Restore' : 'Maximize'
                    }
                  >
                    {maximizedEditor === 'opponent' ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div
                  className={`flex-1 min-h-0 ${
                    maximizedEditor === 'my' ? 'hidden' : ''
                  }`}
                >
                  <CodeEditor
                    value={opponentCode}
                    readOnly={true}
                    language={selectedLanguage}
                    theme={theme}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
