import React, { FC, memo } from "react";
import { useRouter } from "next/router";
import { Game } from "@/types";
import { SubmissionProgress } from "@/types/websocket";
import { PlayingGame } from "../states/PlayingGame";
import { FinishedGame } from "../states/FinishedGame";
import { Button } from "../../ui/Button";
import { Alert } from "../../ui/alert";
import { GAME_ROOM_CONSTANTS } from "../constants/game-room-constants";
import { useRouterHelper } from "@/lib/router";
import { type SupportedLanguage } from "@/constants";
import { useTranslation } from "next-i18next/pages";

interface GameStateRendererProps {
  game: Game;
  currentUser: { id: string };
  myCode: string;
  opponentCode: string;
  selectedLanguage: SupportedLanguage;
  opponentLanguage: SupportedLanguage;
  isSubmitting: boolean;
  submissionProgress: SubmissionProgress;
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: SupportedLanguage) => void;
  onSubmitCode: () => void;
}

export const GameStateRenderer: FC<GameStateRendererProps> = memo(
  ({
    game,
    currentUser,
    myCode,
    opponentCode,
    selectedLanguage,
    opponentLanguage,
    isSubmitting,
    submissionProgress,
    onCodeChange,
    onLanguageChange,
    onSubmitCode,
  }) => {
    const router = useRouter();
    const routerHelper = useRouterHelper(router);
    const { t } = useTranslation("common");

    const me =
      game.playerA?.id === currentUser.id
        ? { id: game.playerA.id, name: game.playerA.name }
        : game.playerB?.id === currentUser.id
          ? { id: game.playerB.id, name: game.playerB.name }
          : undefined;

    const opponent =
      game.playerA?.id === currentUser.id && game.playerB
        ? { id: game.playerB.id, name: game.playerB.name }
        : game.playerB?.id === currentUser.id && game.playerA
          ? { id: game.playerA.id, name: game.playerA.name }
          : undefined;

    const getOpponentName = (): string => {
      if (game.playerA?.id === currentUser.id) {
        return game.playerB?.name ?? "";
      }
      return game.playerA?.name ?? "";
    };

    switch (game.status) {
      case GAME_ROOM_CONSTANTS.GAME_STATUS.WAITING:
        return (
          <Alert variant="warning">
            <h3>{t("game.initializing")}</h3>
            <p>{t("game.initializingDescription")}</p>
          </Alert>
        );

      case GAME_ROOM_CONSTANTS.GAME_STATUS.FINISHED:
        return (
          <FinishedGame
            game={game}
            me={me}
            opponent={opponent}
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
            opponentLanguage={opponentLanguage}
            isSubmitting={isSubmitting}
            submissionProgress={submissionProgress}
            onCodeChange={onCodeChange}
            onLanguageChange={onLanguageChange}
            onSubmitCode={onSubmitCode}
          />
        );

      case GAME_ROOM_CONSTANTS.GAME_STATUS.CLOSED:
        return (
          <Alert variant="warning">
            <h3>{t("game.closed")}</h3>
            <p>{t("game.closedDescription")}</p>
            <Button onClick={() => routerHelper.goToDashboard()}>
              {t("game.backDashboard")}
            </Button>
          </Alert>
        );

      default:
        return (
          <Alert variant="error">
            <h3>{t("game.invalidState")}</h3>
            <p>{t("game.invalidStateDescription")}</p>
            <Button onClick={() => routerHelper.goToDashboard()}>
              {t("game.backDashboard")}
            </Button>
          </Alert>
        );
    }
  },
);

GameStateRenderer.displayName = "GameStateRenderer";
