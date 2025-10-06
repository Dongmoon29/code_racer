import React, { FC, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Spinner } from '../ui';
import { GameStateRenderer } from './components/GameStateRenderer';
import { useGameRoomState } from './hooks/useGameRoomState';
import { useGameRoomWebSocket } from './hooks/useGameRoomWebSocket';
import { useGameData } from './hooks/useGameData';

interface GameRoomProps {
  gameId: string;
}

const GameRoom: FC<GameRoomProps> = ({ gameId: matchId }) => {
  const { user: currentUser, isLoading: isAuthLoading } = useAuthStore();

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
    submitResult,
    setSubmitResult,
    submitting,
    setSubmitting,
    selectedLanguage,
    setSelectedLanguage,
    showMyCode,
    setShowMyCode,
    showOpponentCode,
    setShowOpponentCode,
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
      setSubmitResult,
      setSubmitting,
      setSelectedLanguage,
      refetchGame,
    });

  // Memoized values for performance optimization
  const isGameInProgress = useMemo(
    () => game?.status === 'playing' || game?.status === 'waiting',
    [game?.status]
  );

  const sessionStorageKeys = useMemo(
    () => ({
      code: `match_${matchId}_code`,
      language: `match_${matchId}_language`,
      showMyCode: `match_${matchId}_showMyCode`,
      showOpponentCode: `match_${matchId}_showOpponentCode`,
    }),
    [matchId]
  );

  // Warning and cache cleanup when leaving page
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Show warning only when game is in progress
      if (isGameInProgress) {
        event.preventDefault();
        event.returnValue =
          'Your written code will be lost if you leave this page.';
        return 'Your written code will be lost if you leave this page.';
      }
    };

    // Register browser default warning dialog
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      // Clean up game-related cache when component unmounts
      if (typeof window !== 'undefined') {
        // Use the cleanup function from useGameRoomState
        // This will be handled automatically by the hook
      }

      // Remove event listener
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [matchId, isGameInProgress, sessionStorageKeys]);

  // Loading state handling
  if (isAuthLoading || gameLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{gameError}</p>
          <button
            onClick={refetchGame}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Game Not Found</h2>
          <p className="text-gray-600">
            The requested game could not be found.
          </p>
        </div>
      </div>
    );
  }

  // Game state-based rendering
  return (
    <GameStateRenderer
      game={game}
      currentUser={currentUser}
      myCode={myCode}
      opponentCode={opponentCode}
      selectedLanguage={selectedLanguage}
      showMyCode={showMyCode}
      showOpponentCode={showOpponentCode}
      submitResult={submitResult}
      submitting={submitting}
      onCodeChange={handleCodeChange}
      onLanguageChange={handleLanguageChange}
      onSubmitCode={handleSubmitCode}
      onToggleMyCode={() => setShowMyCode(!showMyCode)}
      onToggleOpponentCode={() => setShowOpponentCode(!showOpponentCode)}
    />
  );
};

export default GameRoom;
