import React, { FC, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Loader } from "../ui/Loader";
import { GameStateRenderer } from "./components/GameStateRenderer";
import { useGameRoomState } from "./hooks/useGameRoomState";
import { useGameRoomWebSocket } from "./hooks/useGameRoomWebSocket";
import { useGameData } from "./hooks/useGameData";

interface GameRoomProps {
  gameId: string;
}

const GameRoom: FC<GameRoomProps> = ({ gameId: matchId }) => {
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
        event.returnValue =
          "Your written code will be lost if you leave this page.";
        return "Your written code will be lost if you leave this page.";
      }
    };

    // Register browser default warning dialog
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isGameInProgress]);

  // Loading state handling
  if (isAuthLoading || gameLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader variant="spinner" size="lg" />
      </div>
    );
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
