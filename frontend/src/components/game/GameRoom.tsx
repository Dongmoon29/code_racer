import React, { FC, useEffect } from 'react';
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
  
  // 게임 데이터 관리
  const { game, loading: gameLoading, error: gameError, fetchGame } = useGameData({ matchId });
  
  // 게임룸 상태 관리
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
    showMyCode,
    setShowMyCode,
    showOpponentCode,
    setShowOpponentCode,
    isTemplateSet,
  } = useGameRoomState({ matchId });
  
  // WebSocket 연결 및 이벤트 핸들링
  const {
    handleCodeChange,
    handleLanguageChange,
    handleSubmitCode,
  } = useGameRoomWebSocket({
    matchId,
    game,
    myCode,
    selectedLanguage,
    isTemplateSet,
    setMyCode,
    setOpponentCode,
    setSubmitResult,
    setSubmitting,
  });
  
  // 페이지 떠날 때 경고 및 캐시 정리
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // 게임이 진행 중일 때만 경고 표시
      if (game?.status === 'playing' || game?.status === 'waiting') {
        event.preventDefault();
        event.returnValue = 'Your written code will be lost if you leave this page.';
        return 'Your written code will be lost if you leave this page.';
      }
    };
    
    // 브라우저 기본 경고창 등록
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      // 컴포넌트가 언마운트될 때 게임 관련 캐시 정리
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`match_${matchId}_code`);
        sessionStorage.removeItem(`match_${matchId}_language`);
        sessionStorage.removeItem(`match_${matchId}_showMyCode`);
        sessionStorage.removeItem(`match_${matchId}_showOpponentCode`);
      }
      
      // 이벤트 리스너 제거
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [matchId, game?.status]);
  
  // 로딩 상태 처리
  if (isAuthLoading || gameLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  
  // 인증되지 않은 사용자 처리
  if (!currentUser) {
    return null;
  }
  
  // 에러 상태 처리
  if (gameError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{gameError}</p>
          <button
            onClick={fetchGame}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // 게임이 없는 경우
  if (!game) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Game Not Found</h2>
          <p className="text-gray-600">The requested game could not be found.</p>
        </div>
      </div>
    );
  }
  
  // 게임 상태별 렌더링
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