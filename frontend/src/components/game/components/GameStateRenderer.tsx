import React, { FC, memo } from 'react';
import { useRouter } from 'next/router';
import { Game, SubmitResult } from '@/types';
import { PlayingGame } from '../states/PlayingGame';
import { FinishedGame } from '../states/FinishedGame';
import { Button } from '../../ui/Button';
import { Alert } from '../../ui/alert';
import { GAME_ROOM_CONSTANTS } from '../constants/game-room-constants';
import { useRouterHelper } from '@/lib/router';
import { type SupportedLanguage } from '@/constants';

interface GameStateRendererProps {
  game: Game;
  currentUser: { id: string };
  myCode: string;
  opponentCode: string;
  selectedLanguage: SupportedLanguage;
  showMyCode: boolean;
  showOpponentCode: boolean;
  submitResult: SubmitResult | null;
  submitting: boolean;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: SupportedLanguage) => void;
  onSubmitCode: () => void;
  onToggleMyCode: () => void;
  onToggleOpponentCode: () => void;
}

export const GameStateRenderer: FC<GameStateRendererProps> = memo(
  ({
    game,
    currentUser,
    myCode,
    opponentCode,
    selectedLanguage,
    showMyCode,
    showOpponentCode,
    submitResult,
    submitting,
    onCodeChange,
    onLanguageChange,
    onSubmitCode,
    onToggleMyCode,
    onToggleOpponentCode,
  }) => {
    const router = useRouter();
    const routerHelper = useRouterHelper(router);

    const getOpponentName = (): string => {
      if (game.playerA?.id === currentUser.id) {
        return game.playerB?.name ?? '';
      }
      return game.playerA?.name ?? '';
    };

    switch (game.status) {
      case GAME_ROOM_CONSTANTS.GAME_STATUS.WAITING:
        return (
          <Alert variant="warning">
            <h3>Game Initializing</h3>
            <p>{GAME_ROOM_CONSTANTS.MESSAGES.GAME_INITIALIZING}</p>
          </Alert>
        );

      case GAME_ROOM_CONSTANTS.GAME_STATUS.FINISHED:
        return (
          <FinishedGame
            game={game}
            myCode={myCode}
            opponentCode={opponentCode}
            selectedLanguage={selectedLanguage}
          />
        );

      case GAME_ROOM_CONSTANTS.GAME_STATUS.PLAYING:
        return (
          <PlayingGame
            game={game}
            myCode={myCode}
            opponentCode={opponentCode}
            opponentName={getOpponentName()}
            selectedLanguage={selectedLanguage}
            showMyCode={showMyCode}
            showOpponentCode={showOpponentCode}
            submitResult={submitResult}
            submitting={submitting}
            onCodeChange={onCodeChange}
            onLanguageChange={onLanguageChange}
            onSubmitCode={onSubmitCode}
            onToggleMyCode={onToggleMyCode}
            onToggleOpponentCode={onToggleOpponentCode}
          />
        );

      case GAME_ROOM_CONSTANTS.GAME_STATUS.CLOSED:
        return (
          <Alert variant="warning">
            <h3>Game Closed</h3>
            <p>{GAME_ROOM_CONSTANTS.MESSAGES.GAME_CLOSED}</p>
            <Button onClick={() => routerHelper.goToDashboard()}>
              {GAME_ROOM_CONSTANTS.MESSAGES.BACK_TO_DASHBOARD}
            </Button>
          </Alert>
        );

      default:
        return (
          <Alert variant="error">
            <h3>Invalid Game State</h3>
            <p>{GAME_ROOM_CONSTANTS.MESSAGES.INVALID_GAME_STATE}</p>
            <Button onClick={() => routerHelper.goToDashboard()}>
              {GAME_ROOM_CONSTANTS.MESSAGES.BACK_TO_DASHBOARD}
            </Button>
          </Alert>
        );
    }
  }
);

GameStateRenderer.displayName = 'GameStateRenderer';
