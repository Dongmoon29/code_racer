import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import MatchmakingWebSocketClient, {
  type MatchingStatusMessage,
  type MatchFoundMessage,
} from '@/lib/matchmaking-websocket';
import { useAuthStore } from '@/stores/authStore';
import { MATCHING_STATE, MatchingState } from '@/lib/constants';
import type { Difficulty } from '@/components/game/DifficultySelector';

export interface UseMatchmakingOptions {
  onMatchFound?: (gameId: string) => void;
  redirectDelayMs?: number;
}

export function useMatchmaking(options: UseMatchmakingOptions = {}) {
  const { onMatchFound, redirectDelayMs = 1500 } = options;
  const router = useRouter();
  const { user } = useAuthStore();

  const [matchingState, setMatchingState] = useState<MatchingState>(
    MATCHING_STATE.IDLE
  );
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waitTimeSeconds, setWaitTimeSeconds] = useState<number>(0);

  const wsClientRef = useRef<MatchmakingWebSocketClient | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);

  const matchingStateRef = useRef<MatchingState>(matchingState);

  useEffect(() => {
    matchingStateRef.current = matchingState;
  }, [matchingState]);

  const cancelMatching = useCallback(() => {
    if (wsClientRef.current) {
      wsClientRef.current.cancelMatching();
      wsClientRef.current.disconnect();
      wsClientRef.current = null;
    }
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    setMatchingState(MATCHING_STATE.IDLE);
    setSelectedDifficulty(null);
    setWaitTimeSeconds(0);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
        wsClientRef.current = null;
      }
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, []);

  const startMatching = async (difficulty: Difficulty) => {
    // 중복 시작 방지: 진행 중이거나 기존 소켓이 있으면 무시
    if (matchingState !== MATCHING_STATE.IDLE || wsClientRef.current) {
      return;
    }
    if (!user) {
      setError('Login is required');
      return;
    }

    try {
      setMatchingState(MATCHING_STATE.CONNECTING);
      setSelectedDifficulty(difficulty);
      setError(null);

      const wsClient = new MatchmakingWebSocketClient({
        onConnect: () => {
          setMatchingState(MATCHING_STATE.SEARCHING);
          wsClient.startMatching(difficulty);
        },

        onStatusUpdate: (message: MatchingStatusMessage) => {
          setWaitTimeSeconds(message.wait_time_seconds || 0);

          if (message.status === 'cancelled') {
            setMatchingState(MATCHING_STATE.IDLE);
            setSelectedDifficulty(null);
          }
        },

        onMatchFound: (message: MatchFoundMessage) => {
          setMatchingState(MATCHING_STATE.FOUND);

          if (wsClientRef.current) {
            wsClientRef.current.disconnect();
            wsClientRef.current = null;
          }

          redirectTimeoutRef.current = window.setTimeout(() => {
            if (onMatchFound) {
              onMatchFound(message.game_id);
            } else {
              router.push(`/game/${message.game_id}`);
            }
          }, redirectDelayMs);
        },

        onDisconnect: () => {
          // ref를 사용하여 최신 matchingState 확인
          // 검색 중일 때만 에러 표시
          if (
            matchingStateRef.current === MATCHING_STATE.CONNECTING ||
            matchingStateRef.current === MATCHING_STATE.SEARCHING
          ) {
            setError('Connection lost. Please try again.');
            setMatchingState(MATCHING_STATE.ERROR);
          }
        },

        onError: (err) => {
          console.error('Matchmaking WebSocket error:', err);
          setError('Connection error occurred. Please try again.');
          setMatchingState(MATCHING_STATE.ERROR);
        },
      });

      wsClientRef.current = wsClient;
      await wsClient.connect();
    } catch (err) {
      console.error('Failed to start matching:', err);
      setError('Matching failed. Please try again.');
      setMatchingState(MATCHING_STATE.ERROR);
    }
  };

  // 라우트 이동 시작 시 자동 취소
  useEffect(() => {
    const handleRouteStart = () => {
      cancelMatching();
    };
    router.events.on('routeChangeStart', handleRouteStart);
    return () => {
      router.events.off('routeChangeStart', handleRouteStart);
    };
  }, [cancelMatching, router.events]);

  // 탭 종료/새로고침 시 자동 취소
  useEffect(() => {
    const onBeforeUnload = () => {
      cancelMatching();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [cancelMatching]);

  // 페이지 숨김 시 자동 취소(백그라운드 전환)
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        cancelMatching();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [cancelMatching]);

  const retryMatching = useCallback(() => {
    setError(null);
    setMatchingState(MATCHING_STATE.IDLE);
  }, []);

  return {
    // state
    matchingState,
    selectedDifficulty,
    error,
    waitTimeSeconds,
    // actions
    startMatching,
    cancelMatching,
    retryMatching,
  };
}
