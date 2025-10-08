import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import WebSocketClient, {
  WebSocketMessage,
  CodeUpdateMessage,
} from '@/lib/websocket';
import { Game, SubmitResult } from '@/types';
import { getCodeTemplate } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { type SupportedLanguage } from '@/constants';
import {
  SubmissionProgress,
  TestCaseDetailMessage,
  SubmissionStatusMessage,
} from '@/types/websocket';

interface UseGameRoomWebSocketProps {
  matchId: string;
  game: Game | null;
  myCode: string;
  selectedLanguage: SupportedLanguage;
  isTemplateSet: React.MutableRefObject<boolean>;
  setMyCode: (code: string) => void;
  setOpponentCode: (code: string) => void;
  setSubmitResult: (result: SubmitResult | null) => void;
  setSubmitting: (submitting: boolean) => void;
  setSelectedLanguage: (language: SupportedLanguage) => void;
  setSubmissionProgress: React.Dispatch<
    React.SetStateAction<SubmissionProgress>
  >;
  refetchGame: () => void;
}

export const useGameRoomWebSocket = ({
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
  setSubmissionProgress,
  refetchGame,
}: UseGameRoomWebSocketProps) => {
  const router = useRouter();
  const wsRef = useRef<WebSocketClient | null>(null);
  const { user: currentUser } = useAuthStore();

  // Template setup
  useEffect(() => {
    if (game?.leetcode && !isTemplateSet.current && !myCode) {
      const template = getCodeTemplate(game.leetcode, selectedLanguage);
      setMyCode(template);
      isTemplateSet.current = true;
    }
  }, [game?.leetcode, isTemplateSet, myCode, selectedLanguage, setMyCode]);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback(
    (message: WebSocketMessage) => {
      switch (message.type) {
        case 'code_update':
          const codeUpdateMessage = message as CodeUpdateMessage;
          if (codeUpdateMessage.code !== undefined) {
            // Only update opponent code if the message is from a different user
            if (codeUpdateMessage.user_id !== currentUser?.id) {
              setOpponentCode(codeUpdateMessage.code);
            }
          }
          break;

        case 'submission_started': {
          const raw = message as unknown as {
            data?: unknown;
            payload?: unknown;
          };
          const m = (raw.data ||
            raw.payload ||
            message) as SubmissionStatusMessage;
          // Only reflect my own submission progress in my UI
          if (m.user_id !== currentUser?.id) break;
          setSubmitting(true);
          setSubmissionProgress({
            isSubmitting: true,
            totalTestCases:
              m.total_test_cases || game?.leetcode?.test_cases?.length || 0,
            completedTestCases: 0,
            testCaseResults: Array.from({
              length:
                m.total_test_cases || game?.leetcode?.test_cases?.length || 0,
            }).map((_, i) => ({
              index: i,
              input: undefined,
              expectedOutput: undefined,
              status: 'pending',
            })),
            statusMessage: 'Evaluating Solution...',
          });
          break;
        }

        case 'test_case_running': {
          const raw = message as unknown as {
            data?: unknown;
            payload?: unknown;
          };
          const m = (raw.data ||
            raw.payload ||
            message) as TestCaseDetailMessage;
          if (m.user_id !== currentUser?.id) break;
          setSubmissionProgress((prev: SubmissionProgress) => {
            const next = { ...prev };
            const list = [...prev.testCaseResults];
            list[m.test_case_index] = {
              index: m.test_case_index,
              input: m.input,
              expectedOutput: m.expected_output,
              status: 'running',
            };
            next.testCaseResults = list;
            return next;
          });
          break;
        }

        case 'test_case_completed': {
          const raw = message as unknown as {
            data?: unknown;
            payload?: unknown;
          };
          const m = (raw.data ||
            raw.payload ||
            message) as TestCaseDetailMessage;
          if (m.user_id !== currentUser?.id) break;
          setSubmissionProgress((prev: SubmissionProgress) => {
            const next = { ...prev };
            const list = [...prev.testCaseResults];
            list[m.test_case_index] = {
              index: m.test_case_index,
              input: m.input,
              expectedOutput: m.expected_output,
              actualOutput: m.actual_output,
              passed: m.passed,
              status: 'completed',
              executionTime: m.execution_time,
              memoryUsage: m.memory_usage,
            };
            next.testCaseResults = list;
            next.completedTestCases = Math.min(
              prev.completedTestCases + 1,
              prev.totalTestCases
            );
            return next;
          });
          break;
        }

        case 'submission_completed': {
          const raw = message as unknown as {
            data?: unknown;
            payload?: unknown;
          };
          const m = (raw.data ||
            raw.payload ||
            message) as SubmissionStatusMessage;
          if (m.user_id !== currentUser?.id) break;
          setSubmitting(false);
          setSubmissionProgress((prev: SubmissionProgress) => ({
            ...prev,
            isSubmitting: false,
            overallPassed: m.passed,
            executionTime: m.execution_time,
            memoryUsage: m.memory_usage,
            statusMessage: m.passed
              ? 'All test cases passed!'
              : 'Some test cases failed.',
          }));
          break;
        }

        case 'submission_failed': {
          const raw = message as unknown as {
            data?: unknown;
            payload?: unknown;
          };
          const m = (raw.data ||
            raw.payload ||
            message) as SubmissionStatusMessage;
          if (m.user_id !== currentUser?.id) break;
          setSubmitting(false);
          setSubmissionProgress((prev: SubmissionProgress) => ({
            ...prev,
            isSubmitting: false,
            statusMessage: 'Submission failed.',
          }));
          setSubmitResult({
            success: false,
            message: 'Submission failed.',
            is_winner: false,
          });
          break;
        }

        case 'game_finished':
          if (message.winner_id) {
            setSubmitResult({
              success: true,
              message: 'Game finished!',
              is_winner: false, // This will be determined by the actual game logic
            });
            // Refresh game data so status becomes 'finished' and UI renders FinishedGame
            refetchGame();
          }
          break;

        case 'error':
          setSubmitResult({
            success: false,
            message: 'An error occurred during the game.',
            is_winner: false,
          });
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    },
    [setOpponentCode, setSubmitResult, currentUser?.id, refetchGame]
  );

  // WebSocket connection setup
  useEffect(() => {
    if (!game) return;

    // Security: No longer check localStorage for token
    // Authentication is handled via httpOnly cookies

    const wsClient = new WebSocketClient(matchId);

    wsClient.addMessageHandler(handleWebSocketMessage);

    // Error handler is handled internally by WebSocketClient, no separate setup needed

    wsRef.current = wsClient;

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [game, matchId, router, handleWebSocketMessage, setSubmitResult]);

  // Code change handler
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setMyCode(newCode);

      if (wsRef.current) {
        wsRef.current.sendCodeUpdate(newCode);
      }
    },
    [setMyCode]
  );

  // Language change handler
  const handleLanguageChange = useCallback(
    (newLanguage: SupportedLanguage) => {
      setSubmitting(false);
      setSubmitResult(null);
      setSelectedLanguage(newLanguage);

      if (game?.leetcode) {
        const template = getCodeTemplate(game.leetcode, newLanguage);
        setMyCode(template);

        if (wsRef.current) {
          wsRef.current.sendCodeUpdate(template);
        }
      }
    },
    [
      game?.leetcode,
      setMyCode,
      setSubmitting,
      setSubmitResult,
      setSelectedLanguage,
    ]
  );

  // Code submission handler
  const handleSubmitCode = useCallback(async () => {
    if (!game) return;

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch(`/api/matches/${matchId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          code: myCode,
          language: selectedLanguage,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitResult({
          success: true,
          message: result.is_winner
            ? 'Congratulations! You won!'
            : 'Solution submitted successfully.',
          is_winner: result.is_winner || false,
        });
      } else {
        setSubmitResult({
          success: false,
          message: result.message || 'Submission failed.',
          is_winner: false,
        });
      }
    } catch {
      setSubmitResult({
        success: false,
        message: 'Network error occurred.',
        is_winner: false,
      });
    } finally {
      setSubmitting(false);
    }
  }, [game, matchId, myCode, selectedLanguage, setSubmitting, setSubmitResult]);

  return {
    handleCodeChange,
    handleLanguageChange,
    handleSubmitCode,
  };
};
