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
import { WEBSOCKET_MESSAGE_TYPES } from '@/constants/websocket';

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

// Helper function to unwrap WebSocket messages
const unwrapMessage = <T>(message: WebSocketMessage): T => {
  const raw = message as unknown as { data?: unknown; payload?: unknown };
  return (raw.data || raw.payload || message) as T;
};

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

  // Message type handlers
  const handleCodeUpdate = useCallback(
    (message: CodeUpdateMessage) => {
      if (message.code !== undefined) {
        // Only update opponent code if the message is from a different user
        if (message.user_id !== currentUser?.id) {
          setOpponentCode(message.code);
        }
      }
    },
    [currentUser?.id, setOpponentCode]
  );

  const handleSubmissionStarted = useCallback(
    (message: SubmissionStatusMessage) => {
      // Only reflect my own submission progress in my UI
      if (message.user_id !== currentUser?.id) return;

      setSubmitting(true);
      setSubmissionProgress({
        isSubmitting: true,
        totalTestCases:
          message.total_test_cases || game?.leetcode?.test_cases?.length || 0,
        completedTestCases: 0,
        testCaseResults: Array.from({
          length:
            message.total_test_cases || game?.leetcode?.test_cases?.length || 0,
        }).map((_, i) => ({
          index: i,
          input: undefined,
          expectedOutput: undefined,
          status: 'pending',
        })),
        statusMessage: 'Evaluating Solution...',
      });
    },
    [
      currentUser?.id,
      setSubmitting,
      setSubmissionProgress,
      game?.leetcode?.test_cases?.length,
    ]
  );

  const handleTestCaseRunning = useCallback(
    (message: TestCaseDetailMessage) => {
      if (message.user_id !== currentUser?.id) return;

      setSubmissionProgress((prev: SubmissionProgress) => {
        const next = { ...prev };
        const list = [...prev.testCaseResults];
        list[message.test_case_index] = {
          index: message.test_case_index,
          input: message.input,
          expectedOutput: message.expected_output,
          status: 'running',
        };
        next.testCaseResults = list;
        return next;
      });
    },
    [currentUser?.id, setSubmissionProgress]
  );

  const handleTestCaseCompleted = useCallback(
    (message: TestCaseDetailMessage) => {
      if (message.user_id !== currentUser?.id) return;

      setSubmissionProgress((prev: SubmissionProgress) => {
        const next = { ...prev };
        const list = [...prev.testCaseResults];
        list[message.test_case_index] = {
          index: message.test_case_index,
          input: message.input,
          expectedOutput: message.expected_output,
          actualOutput: message.actual_output,
          passed: message.passed,
          status: 'completed',
          executionTime: message.execution_time,
          memoryUsage: message.memory_usage,
        };
        next.testCaseResults = list;
        next.completedTestCases = Math.min(
          prev.completedTestCases + 1,
          prev.totalTestCases
        );
        return next;
      });
    },
    [currentUser?.id, setSubmissionProgress]
  );

  const handleSubmissionCompleted = useCallback(
    (message: SubmissionStatusMessage) => {
      if (message.user_id !== currentUser?.id) return;

      setSubmitting(false);
      setSubmissionProgress((prev: SubmissionProgress) => ({
        ...prev,
        isSubmitting: false,
        overallPassed: message.passed,
        executionTime: message.execution_time,
        memoryUsage: message.memory_usage,
        statusMessage: message.passed
          ? 'All test cases passed!'
          : 'Some test cases failed.',
      }));
    },
    [currentUser?.id, setSubmitting, setSubmissionProgress]
  );

  const handleSubmissionFailed = useCallback(
    (message: SubmissionStatusMessage) => {
      if (message.user_id !== currentUser?.id) return;

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
    },
    [currentUser?.id, setSubmitting, setSubmissionProgress, setSubmitResult]
  );

  const handleGameFinished = useCallback(
    (message: WebSocketMessage) => {
      if (message.winner_id) {
        setSubmitResult({
          success: true,
          message: 'Game finished!',
          is_winner: false, // This will be determined by the actual game logic
        });
        // Refresh game data so status becomes 'finished' and UI renders FinishedGame
        refetchGame();
      }
    },
    [setSubmitResult, refetchGame]
  );

  const handleError = useCallback(() => {
    setSubmitResult({
      success: false,
      message: 'An error occurred during the game.',
      is_winner: false,
    });
  }, [setSubmitResult]);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback(
    (message: WebSocketMessage) => {
      switch (message.type) {
        case WEBSOCKET_MESSAGE_TYPES.CODE_UPDATE:
          handleCodeUpdate(message as CodeUpdateMessage);
          break;

        case WEBSOCKET_MESSAGE_TYPES.SUBMISSION_STARTED:
          handleSubmissionStarted(
            unwrapMessage<SubmissionStatusMessage>(message)
          );
          break;

        case WEBSOCKET_MESSAGE_TYPES.TEST_CASE_RUNNING:
          handleTestCaseRunning(unwrapMessage<TestCaseDetailMessage>(message));
          break;

        case WEBSOCKET_MESSAGE_TYPES.TEST_CASE_COMPLETED:
          handleTestCaseCompleted(
            unwrapMessage<TestCaseDetailMessage>(message)
          );
          break;

        case WEBSOCKET_MESSAGE_TYPES.SUBMISSION_COMPLETED:
          handleSubmissionCompleted(
            unwrapMessage<SubmissionStatusMessage>(message)
          );
          break;

        case WEBSOCKET_MESSAGE_TYPES.SUBMISSION_FAILED:
          handleSubmissionFailed(
            unwrapMessage<SubmissionStatusMessage>(message)
          );
          break;

        case WEBSOCKET_MESSAGE_TYPES.GAME_FINISHED:
          handleGameFinished(message);
          break;

        case WEBSOCKET_MESSAGE_TYPES.ERROR:
          handleError();
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    },
    [
      handleCodeUpdate,
      handleSubmissionStarted,
      handleTestCaseRunning,
      handleTestCaseCompleted,
      handleSubmissionCompleted,
      handleSubmissionFailed,
      handleGameFinished,
      handleError,
    ]
  );

  // WebSocket connection setup
  useEffect(() => {
    if (!game) return;

    const wsClient = new WebSocketClient(matchId);

    wsClient.addMessageHandler(handleWebSocketMessage);

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
