import React, { useEffect, useState, useRef, FC } from 'react';
import { useRouter } from 'next/router';
import { matchApi } from '../../lib/api';
import WebSocketClient, {
  WebSocketMessage,
  CodeUpdateMessage,
} from '../../lib/websocket';
import { Spinner } from '../ui';
import { Game, SubmitResult } from '@/types';

import { PlayingGame } from './states/PlayingGame';
import { FinishedGame } from './states/FinishedGame';
import { useAuthStore } from '@/stores/authStore';
import axios, { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types';
import { Button } from '../ui/Button';
import { Alert } from '../ui/alert';
import { getCodeTemplate } from '@/lib/api';

interface GameRoomProps {
  gameId: string;
}

const GameRoom: FC<GameRoomProps> = ({ gameId: matchId }) => {
  const router = useRouter();
  const { user: currentUser, isLoading } = useAuthStore();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [myCode, setMyCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`match_${matchId}_code`) || '';
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
        (sessionStorage.getItem(`match_${matchId}_language`) as
          | 'python'
          | 'javascript'
          | 'go') || 'javascript'
      );
    }
    return 'javascript';
  });
  const [showMyCode, setShowMyCode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`match_${matchId}_showMyCode`) !== 'false';
    }
    return true;
  });
  const [showOpponentCode, setShowOpponentCode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        sessionStorage.getItem(`match_${matchId}_showOpponentCode`) !== 'false'
      );
    }
    return true;
  });
  const wsRef = useRef<WebSocketClient | null>(null);
  const isTemplateSet = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`match_${matchId}_code`, myCode);
    }
  }, [myCode, matchId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`match_${matchId}_language`, selectedLanguage);
    }
  }, [selectedLanguage, matchId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`match_${matchId}_showMyCode`, String(showMyCode));
    }
  }, [showMyCode, matchId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        `match_${matchId}_showOpponentCode`,
        String(showOpponentCode)
      );
    }
  }, [showOpponentCode, matchId]);

  useEffect(() => {
    if (game?.leetcode && !isTemplateSet.current && !myCode) {
      const template = getCodeTemplate(game.leetcode, selectedLanguage);
      setMyCode(template);
      isTemplateSet.current = true;
    }
  }, [game?.leetcode, selectedLanguage, myCode]);

  // 게임이 종료되면 sessionStorage 정리
  useEffect(() => {
    if (game?.status === 'finished' || game?.status === 'closed') {
      sessionStorage.removeItem(`match_${matchId}_code`);
      sessionStorage.removeItem(`match_${matchId}_language`);
      sessionStorage.removeItem(`match_${matchId}_showMyCode`);
      sessionStorage.removeItem(`match_${matchId}_showOpponentCode`);
    }
  }, [game?.status, matchId]);

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
      sessionStorage.removeItem(`match_${matchId}_code`);
      sessionStorage.removeItem(`match_${matchId}_language`);
      sessionStorage.removeItem(`match_${matchId}_showMyCode`);
      sessionStorage.removeItem(`match_${matchId}_showOpponentCode`);
      
      // 이벤트 리스너 제거
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [matchId, game?.status]);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        const response = await matchApi.getGame(matchId);
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
  }, [matchId]);

  // WebSocket 효과
  useEffect(() => {
    if (game?.status === 'playing' || game?.status === 'waiting') {
      wsRef.current = new WebSocketClient(matchId);

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
  }, [game?.status, matchId, currentUser?.id]);

  if (isLoading || !currentUser) {
    return;
  }

  // No need to pass me/opponent; child components work with myCode/opponentCode.

  const renderGameState = () => {
    if (!game) return null;

    switch (game.status) {
      case 'waiting':
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
            myCode={myCode}
            opponentCode={opponentCode}
            selectedLanguage={selectedLanguage}
          />
        );

      case 'playing':
        return (
          <PlayingGame
            game={game}
            myCode={myCode}
            opponentCode={opponentCode}
            opponentName={
              (game.playerA?.id === currentUser.id
                ? game.playerB?.name
                : game.playerA?.name) ?? ''
            }
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
      const response = await matchApi.getGame(matchId);
      setGame(response.game);
    } catch (err) {
      console.error('Failed to refresh game:', err);
    }
  };

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
      const response = await matchApi.submitSolution(
        matchId,
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

  return renderGameState();
};

export default GameRoom;
