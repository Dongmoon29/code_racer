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
      // Send cancel request and wait for server confirmation
      wsClientRef.current.cancelMatching();
      // Don't disconnect immediately - wait for server response
    }
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    // Update UI state immediately for better UX
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
    // Prevent duplicate start: ignore if in progress or existing socket
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

          if (message.status === 'canceled') {
            setMatchingState(MATCHING_STATE.IDLE);
            setSelectedDifficulty(null);
            setWaitTimeSeconds(0);
            setError(null);

            // Disconnect after server confirmation
            if (wsClientRef.current) {
              wsClientRef.current.disconnect();
              wsClientRef.current = null;
            }
          }
        },

        onMatchFound: (message: MatchFoundMessage) => {
          console.log('Match found:', message);
          setMatchingState(MATCHING_STATE.FOUND);

          if (wsClientRef.current) {
            wsClientRef.current.disconnectAfterMatch();
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

        onMatchmakingDisconnect: () => {
          // Intentional disconnect after matchmaking completion - no error handling
          console.log('Matchmaking completed, disconnecting intentionally');
        },

        onDisconnect: () => {
          // Use ref to check latest matchingState
          // Show error only when searching
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

  // Auto-cancel when route navigation starts
  useEffect(() => {
    const handleRouteStart = () => {
      cancelMatching();
    };
    router.events.on('routeChangeStart', handleRouteStart);
    return () => {
      router.events.off('routeChangeStart', handleRouteStart);
    };
  }, [cancelMatching, router.events]);

  // Auto-cancel when tab closes/refreshes
  useEffect(() => {
    const onBeforeUnload = () => {
      cancelMatching();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [cancelMatching]);

  // Auto-cancel when page is hidden (background switch) - re-enabled
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
