import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { gameApi } from '../../lib/api';
import WebSocketClient, {
  WebSocketMessage,
  CodeUpdateMessage,
} from '../../lib/websocket';
import { Spinner } from '../ui';
import { Game, SubmitResult } from './types';
// REMOVED: Room waiting states - replaced by automatic matching
// import { WaitingToJoinGame } from './states/WaitingToJoinGame';
// import { WaitingForOpponent } from './states/WaitingForOpponent';
import { PlayingGame } from './states/PlayingGame';
import { FinishedGame } from './states/FinishedGame';
import { useAuthStore } from '@/stores/authStore';
import axios, { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/lib/types';
import { Button } from '../ui/Button';
import { Alert } from '../ui/alert';
import { getCodeTemplate } from '@/lib/api';

interface GameRoomProps {
  gameId: string;
}

const GameRoom: React.FC<GameRoomProps> = ({ gameId }) => {
  const router = useRouter();
  const { user: currentUser, isLoading } = useAuthStore();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [myCode, setMyCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`game_${gameId}_code`) || '';
    }
    return '';
  });
  const [opponentCode, setOpponentCode] = useState<string>('');
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<
    'python' | 'javascript' | 'go'
  >(() => {
    if (typeof window !== 'undefined') {
      return (
        (localStorage.getItem(`game_${gameId}_language`) as
          | 'python'
          | 'javascript'
          | 'go') || 'javascript'
      );
    }
    return 'javascript';
  });
  const [showMyCode, setShowMyCode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`game_${gameId}_showMyCode`) !== 'false';
    }
    return true;
  });
  const [showOpponentCode, setShowOpponentCode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem(`game_${gameId}_showOpponentCode`) !== 'false'
      );
    }
    return true;
  });
  const wsRef = useRef<WebSocketClient | null>(null);
  // 초기 템플릿 설정을 위한 ref
  const isTemplateSet = useRef(false);

  // 상태 변경 시 localStorage에 저장
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`game_${gameId}_code`, myCode);
    }
  }, [myCode, gameId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`game_${gameId}_language`, selectedLanguage);
    }
  }, [selectedLanguage, gameId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`game_${gameId}_showMyCode`, String(showMyCode));
    }
  }, [showMyCode, gameId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        `game_${gameId}_showOpponentCode`,
        String(showOpponentCode)
      );
    }
  }, [showOpponentCode, gameId]);

  useEffect(() => {
    if (game?.leetcode && !isTemplateSet.current && !myCode) {
      const template = getCodeTemplate(game.leetcode, selectedLanguage);
      setMyCode(template);
      isTemplateSet.current = true;
    }
  }, [game?.leetcode, selectedLanguage, myCode]);

  // 게임이 종료되면 localStorage 정리
  useEffect(() => {
    if (game?.status === 'finished' || game?.status === 'closed') {
      localStorage.removeItem(`game_${gameId}_code`);
      localStorage.removeItem(`game_${gameId}_language`);
      localStorage.removeItem(`game_${gameId}_showMyCode`);
      localStorage.removeItem(`game_${gameId}_showOpponentCode`);
    }
  }, [game?.status, gameId]);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        const response = await gameApi.getGame(gameId);
        setGame(response.game);
        setError(null);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError<ApiErrorResponse>;
          setError(axiosError.response?.data?.message || 'Failed to load game');
        } else {
          setError('An unexpected error occurred while loading the game');
        }
        console.error('Failed to load game:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
    const interval = setInterval(fetchGame, 5000);
    return () => clearInterval(interval);
  }, [gameId]);

  // WebSocket 효과
  useEffect(() => {
    if (game?.status === 'playing' || game?.status === 'waiting') {
      wsRef.current = new WebSocketClient(gameId);

      const handleMessage = (message: WebSocketMessage) => {
        if (message.type === 'code_update') {
          const codeMsg = message as CodeUpdateMessage;

          if (codeMsg.user_id !== currentUser?.id) {
            setOpponentCode(codeMsg.code);
          }
        } else if (
          message.type === 'game_start' ||
          message.type === 'game_end'
        ) {
          fetchGame();
        }
      };

      wsRef.current.addMessageHandler(handleMessage);

      return () => {
        if (wsRef.current) {
          wsRef.current.removeMessageHandler(handleMessage);
          wsRef.current.disconnect();
        }
      };
    }
  }, [game?.status, gameId, currentUser?.id]);

  if (isLoading || !currentUser) {
    return;
  }

  // REMOVED: handleCloseGame - no room concept in matching system

  const renderGameState = () => {
    if (!game) return null;

    // REMOVED: isCreator check - no longer needed without room concept

    switch (game.status) {
      case 'waiting':
        // REMOVED: Room waiting states - games start automatically after matching
        return (
          <Alert variant="warning">
            <h3>Game Initializing</h3>
            <p>Setting up your match...</p>
          </Alert>
        );

      case 'finished':
        return (
          <FinishedGame
            game={game}
            currentUserId={currentUser?.id || ''}
            myCode={myCode}
            opponentCode={opponentCode}
            selectedLanguage={selectedLanguage}
          />
        );

      case 'playing':
        return (
          <PlayingGame
            game={game}
            currentUserId={currentUser?.id || ''}
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

      case 'closed':
        return (
          <Alert variant="warning">
            <h3>Game Closed</h3>
            <p>This game room has been closed by the creator.</p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to dashboard
            </Button>
          </Alert>
        );

      default:
        return (
          <Alert variant="error">
            <h3>Invalid Game State</h3>
            <p>The game is in an invalid state.</p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to dashboard
            </Button>
          </Alert>
        );
    }
  };

  const fetchGame = async () => {
    try {
      const response = await gameApi.getGame(gameId);
      setGame(response.game);
    } catch (err) {
      console.error('Failed to refresh game:', err);
    }
  };

  // REMOVED: handleJoinGame - replaced by automatic matching

  const handleCodeChange = (code: string) => {
    setMyCode(code);
    if (wsRef.current) {
      wsRef.current.sendCodeUpdate(code);
    }
  };

  const handleLanguageChange = (language: 'python' | 'javascript' | 'go') => {
    if (
      window.confirm(
        'Changing language will reset your code to template. Continue?'
      )
    ) {
      setSelectedLanguage(language);
      if (game?.leetcode) {
        const template = getCodeTemplate(game.leetcode, language);
        setMyCode(template);
        // 언어 변경 시에도 WebSocket으로 코드 업데이트를 전송
        if (wsRef.current) {
          wsRef.current.sendCodeUpdate(template);
        }
      }
    }
  };

  const handleSubmitCode = async () => {
    if (!myCode.trim()) {
      setSubmitResult({
        success: false,
        message: 'Code cannot be empty',
        is_winner: false,
      });
      return;
    }

    try {
      setSubmitting(true);
      setSubmitResult(null);
      const response = await gameApi.submitSolution(
        gameId,
        myCode,
        selectedLanguage
      );
      setSubmitResult(response);
      if (response.is_winner) {
        fetchGame();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse>;

        // Judge0 API 할당량 초과 에러 처리
        if (
          axiosError.response?.status === 429 &&
          axiosError.response?.data?.error_type === 'judge0_quota_exceeded'
        ) {
          setSubmitResult({
            success: false,
            message:
              'The code evaluation service is temporarily unavailable. Please try again later.',
            is_winner: false,
          });
        } else {
          setSubmitResult({
            success: false,
            message:
              axiosError.response?.data?.message || 'Failed to submit code',
            is_winner: false,
          });
        }
      } else {
        setSubmitResult({
          success: false,
          message: 'An unexpected error occurred while submitting your code',
          is_winner: false,
        });
      }
      console.error('Failed to submit code:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading and error states
  if (loading && !game) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        <h3>Error</h3>
        <p>{error}</p>
        <Button onClick={() => router.push('/dashboard')}>Go Back</Button>
      </Alert>
    );
  }

  if (!game) {
    return (
      <Alert variant="warning">
        <h3>Game Not Found</h3>
        <p>The requested game room does not exist or has been deleted.</p>
        <Button onClick={() => router.push('/dashboard')}>Go Back</Button>
      </Alert>
    );
  }

  // Render appropriate component based on game state

  return renderGameState();
};

export default GameRoom;
