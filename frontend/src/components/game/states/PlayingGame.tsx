import React, { useState } from 'react';
import { Spinner } from '../../ui';
import CodeEditor from '../CodeEditor';
import LanguageSelector from '../LanguageSelector';
import { Game, SubmitResult } from '../types';
import { FileText, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/alert';

interface Props {
  game: Game;
  currentUserId: string;
  myCode: string;
  opponentCode: string;
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

export const PlayingGame: React.FC<Props> = ({
  game,
  currentUserId,
  myCode,
  opponentCode,
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
  const isCreator = currentUserId === game.creator.id;

  const handleMaximizeToggle = (editor: 'my' | 'opponent') => {
    setMaximizedEditor((current) => (current === editor ? null : editor));
  };

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
            {/* TODO: theme selector는 에디터에만 적용되어야함 */}
            {/* <ThemeSelector /> */}
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

      {/* Main content - flex-1로 남은 공간 모두 사용 */}
      <div className="flex-1 px-4 flex w-full min-h-0">
        {/* Problem Description - flex-basis로 기본 너비 설정 */}
        <div
          className={`
            transition-all duration-300 overflow-auto
            ${
              isDescriptionExpanded
                ? 'flex-[0_0_33.333%]' // flex: 0 0 33.333%
                : 'flex-[0_0_40px]' // flex: 0 0 40px
            }
          `}
        >
          {isDescriptionExpanded ? (
            // 확장된 상태
            <div className="bg-[hsl(var(--muted))] rounded-lg">
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
                  <pre className="p-3 rounded bg-[hsl(var(--muted))]">
                    {game.leetcode.constraints}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            // 최소화된 상태 - FileText 아이콘으로 변경
            <button
              onClick={() => setIsDescriptionExpanded(true)}
              className="w-full h-10 flex items-center justify-center text-[hsl(var(--muted-foreground))] rounded-lg hover:text-white hover:scale-110 transition-all duration-200"
              title="Show Problem Details"
            >
              <FileText className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Code Editors Container */}
        <div className="flex gap-4 ml-4 flex-1">
          <div
            className={`
              transition-all duration-300 border border-gray-200 rounded-lg overflow-hidden
              ${
                maximizedEditor === 'opponent'
                  ? 'w-[40px]'
                  : maximizedEditor === 'my'
                  ? 'w-full'
                  : 'w-1/2'
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
                  : 'w-1/2'
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
                {isCreator ? game.opponent?.name : game.creator.name}
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
    </div>
  );
};
