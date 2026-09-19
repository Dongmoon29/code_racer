import React, { FC, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuthStore } from "@/stores/authStore";
import { GameRoomSkeleton } from "../ui/Skeleton";
import { GameStateRenderer } from "./components/GameStateRenderer";
import { useGameRoomState } from "./hooks/useGameRoomState";
import { useGameRoomWebSocket } from "./hooks/useGameRoomWebSocket";
import { useGameData } from "./hooks/useGameData";
import { closeGame } from "@/api/game";

interface GameRoomProps {
  gameId: string;
}

const GameRoom: FC<GameRoomProps> = ({ gameId: matchId }) => {
  const router = useRouter();
  const allowNavigationRef = useRef(false);
  const isClosingRef = useRef(false);
  const currentUser = useAuthStore((state) => state.user);
  const isAuthLoading = useAuthStore((state) => state.isLoading);

  // Game data management
  const {
    game,
    loading: gameLoading,
    error: gameError,
    refetch: refetchGame,
  } = useGameData({ matchId });

  // Game room state management
  const {
    myCode,
    setMyCode,
    opponentCode,
    setOpponentCode,
    isSubmitting,
    setIsSubmitting,
    submissionProgress,
    setSubmissionProgress,
    selectedLanguage,
    setSelectedLanguage,
    opponentLanguage,
    setOpponentLanguage,
    isTemplateSet,
  } = useGameRoomState({ matchId });

  // WebSocket connection and event handling
  const { handleCodeChange, handleLanguageChange, handleSubmitCode } =
    useGameRoomWebSocket({
      matchId,
      game,
      myCode,
      selectedLanguage,
      isTemplateSet,
      setMyCode,
      setOpponentCode,
      setIsSubmitting,
      setSelectedLanguage,
      setOpponentLanguage,
      setSubmissionProgress,
      refetchGame,
    });

  const isGameInProgress =
    game?.status === "playing" || game?.status === "waiting";
  const isSinglePlayerMode = game?.mode === "single";

  // Warning and cache cleanup when leaving page
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Show warning only when game is in progress
      if (isGameInProgress) {
        event.preventDefault();
        event.returnValue = "Your game is still in progress.";
        return "Your game is still in progress.";
      }
    };

    // Register browser default warning dialog
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isGameInProgress]);

  // Internal navigation can be paused long enough to explicitly finish the
  // game. Closing a tab still uses the browser warning and reconnect grace.
  useEffect(() => {
    if (!isGameInProgress) return;

    const handleRouteChangeStart = (url: string) => {
      if (
        allowNavigationRef.current ||
        isClosingRef.current ||
        url === router.asPath
      ) {
        return;
      }

      const confirmed = window.confirm(
        "A game is still in progress. End the game and leave this page?",
      );
      const cancellationError = new Error("Game navigation cancelled");
      Object.assign(cancellationError, { cancelled: true });
      router.events.emit("routeChangeError", cancellationError, url, {
        shallow: false,
      });

      if (confirmed) {
        isClosingRef.current = true;
        void closeGame(matchId)
          .then(() => {
            allowNavigationRef.current = true;
            return router.push(url);
          })
          .catch(() => {
            isClosingRef.current = false;
            window.alert("The game could not be ended. Please try again.");
          });
      }

      throw cancellationError;
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
    };
  }, [isGameInProgress, matchId, router]);

  // Loading state handling
  if (isAuthLoading || gameLoading) {
    return <GameRoomSkeleton />;
  }

  // Unauthenticated user handling
  if (!currentUser) {
    return null;
  }

  // Error state handling
  if (gameError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--red-11)] mb-2">
            Error
          </h2>
          <p className="text-[var(--gray-11)] mb-4">{gameError}</p>
          <button
            onClick={refetchGame}
            className="px-4 py-2 bg-[var(--accent-9)] text-white rounded hover:bg-[var(--accent-10)] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No game case
  if (!game) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-[var(--color-text)]">
            Game Not Found
          </h2>
          <p className="text-[var(--gray-11)]">
            The requested game could not be found.
          </p>
        </div>
      </div>
    );
  }

  // Game state-based rendering
  return (
    <div className="h-full">
      <GameStateRenderer
        game={game}
        currentUser={currentUser}
        myCode={myCode}
        opponentCode={isSinglePlayerMode ? "" : opponentCode}
        selectedLanguage={selectedLanguage}
        opponentLanguage={
          isSinglePlayerMode ? selectedLanguage : opponentLanguage
        }
        isSubmitting={isSubmitting}
        submissionProgress={submissionProgress}
        onCodeChange={handleCodeChange}
        onLanguageChange={handleLanguageChange}
        onSubmitCode={handleSubmitCode}
      />
    </div>
  );
};

export default GameRoom;
