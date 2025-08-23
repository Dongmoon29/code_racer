import React, { useState } from 'react';
import { Spinner } from '../../ui';
import CodeEditor from '../CodeEditor';
import LanguageSelector from '../LanguageSelector';
import { Game, SubmitResult } from '../types';
import { FileText, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ButtonStyled as Button } from '@/components/ui';
import { AlertStyled as Alert } from '@/components/ui';
import {
  GameContainer,
  GameHeader,
  GameTitleSection,
  GameTitle,
  GameControls,
  MainContent,
  ProblemDescription,
  ProblemCard,
  ProblemHeader,
  ProblemTitle,
  MinimizeButton,
  ProblemContent,
  ProblemSection,
  ProblemSectionTitle,
  ProblemSectionSubtitle,
  ProblemText,
  ProblemCode,
  CodeEditorsContainer,
  CodeEditorWrapper,
  CodeEditorHeader,
  CodeEditorTitle,
  CodeEditorControls,
  VimModeToggle,
  MaximizeButton,
  CodeEditorContent,
  MinimizedProblemButton,
} from './PlayingGame.styled';

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
  const [myVimMode, setMyVimMode] = useState(false);
  const isCreator = currentUserId === game.creator.id;

  const handleMaximizeToggle = (editor: 'my' | 'opponent') => {
    setMaximizedEditor((current) => (current === editor ? null : editor));
  };

  return (
    <GameContainer>
      {/* Header */}
      <GameHeader>
        <GameTitleSection>
          <GameTitle>{game.leetcode.title}</GameTitle>
          <div className="flex items-center gap-4 mt-2">
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onChange={onLanguageChange}
            />
          </div>
        </GameTitleSection>
        <GameControls>
          <Button
            onClick={onSubmitCode}
            disabled={submitting}
            className="w-full md:w-auto"
          >
            {submitting ? <Spinner size="sm" /> : 'Submit Solution'}
          </Button>
        </GameControls>
      </GameHeader>

      {/* Submit Result Alert */}
      {submitResult && (
        <Alert
          variant={submitResult.success ? 'success' : 'error'}
          className="px-4 mb-4"
        >
          {submitResult.message}
        </Alert>
      )}

      {/* Main content - 기존 로직과 동일하게 설정 */}
      <MainContent>
        {/* Problem Description - 기존 resize 로직 복원 */}
        <ProblemDescription isExpanded={isDescriptionExpanded}>
          {isDescriptionExpanded ? (
            // 확장된 상태
            <ProblemCard>
              <ProblemHeader>
                <ProblemTitle>Problem Details</ProblemTitle>
                <MinimizeButton
                  onClick={() => setIsDescriptionExpanded(false)}
                  title="Minimize"
                >
                  <Minimize2 className="w-4 h-4" />
                </MinimizeButton>
              </ProblemHeader>

              <ProblemContent>
                <ProblemSection>
                  <ProblemSectionTitle>Problem Description</ProblemSectionTitle>
                  <ProblemText>{game.leetcode.description}</ProblemText>
                </ProblemSection>
                <ProblemSection>
                  <ProblemSectionSubtitle>Examples</ProblemSectionSubtitle>
                  <ProblemCode>{game.leetcode.examples}</ProblemCode>
                </ProblemSection>
                <ProblemSection>
                  <ProblemSectionSubtitle>Constraints</ProblemSectionSubtitle>
                  <ProblemCode>{game.leetcode.constraints}</ProblemCode>
                </ProblemSection>
              </ProblemContent>
            </ProblemCard>
          ) : (
            // 최소화된 상태 - FileText 아이콘으로 변경
            <MinimizedProblemButton
              onClick={() => setIsDescriptionExpanded(true)}
              title="Show Problem Details"
            >
              <FileText className="w-6 h-6" />
            </MinimizedProblemButton>
          )}
        </ProblemDescription>

        {/* Code Editors Container - flex로 남은 공간 모두 차지 */}
        <CodeEditorsContainer>
          <CodeEditorWrapper
            maximized={maximizedEditor === 'opponent'}
            isOpponent={false}
            maximizedEditor={maximizedEditor}
          >
            <CodeEditorHeader maximized={maximizedEditor === 'opponent'}>
              <CodeEditorTitle maximized={maximizedEditor === 'opponent'}>
                Me
              </CodeEditorTitle>
              <CodeEditorControls>
                {/* Vim 모드 토글 버튼 */}
                <VimModeToggle
                  isActive={myVimMode}
                  onClick={() => setMyVimMode(!myVimMode)}
                  title={myVimMode ? 'Vim 모드' : '일반 모드'}
                >
                  {myVimMode ? 'VIM' : 'NORMAL'}
                </VimModeToggle>
                <MaximizeButton
                  onClick={() => handleMaximizeToggle('my')}
                  title={maximizedEditor === 'my' ? 'Restore' : 'Maximize'}
                >
                  {maximizedEditor === 'my' ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </MaximizeButton>
              </CodeEditorControls>
            </CodeEditorHeader>
            <CodeEditorContent maximized={maximizedEditor === 'opponent'}>
              <CodeEditor
                value={myCode}
                onChange={onCodeChange}
                language={selectedLanguage}
                theme={theme}
                vimMode={myVimMode}
              />
            </CodeEditorContent>
          </CodeEditorWrapper>

          <CodeEditorWrapper
            maximized={maximizedEditor === 'my'}
            isOpponent={true}
            maximizedEditor={maximizedEditor}
          >
            <CodeEditorHeader maximized={maximizedEditor === 'my'}>
              <CodeEditorTitle maximized={maximizedEditor === 'my'}>
                {isCreator ? game.opponent?.name : game.creator.name}
              </CodeEditorTitle>
              <MaximizeButton
                onClick={() => handleMaximizeToggle('opponent')}
                title={maximizedEditor === 'opponent' ? 'Restore' : 'Maximize'}
              >
                {maximizedEditor === 'opponent' ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </MaximizeButton>
            </CodeEditorHeader>
            <CodeEditorContent maximized={maximizedEditor === 'my'}>
              <CodeEditor
                value={opponentCode}
                readOnly={true}
                language={selectedLanguage}
                theme={theme}
              />
            </CodeEditorContent>
          </CodeEditorWrapper>
        </CodeEditorsContainer>
      </MainContent>
    </GameContainer>
  );
};

export default PlayingGame;
