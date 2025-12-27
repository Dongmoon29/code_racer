import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import WebSocketClient, {
  type WebSocketMessage,
  type CodeUpdateMessage,
  isCodeUpdateMessage,
  isGameFinishedMessage,
  isErrorMessage,
  isSubmissionStartedMessage,
  isSubmissionCompletedMessage,
  isSubmissionFailedMessage,
  isTestCaseRunningMessage,
  isTestCaseCompletedMessage,
  unwrapSubmissionMessage,
  unwrapTestCaseMessage,
} from '@/lib/websocket';
import { Game, SubmitResult } from '@/types';
import { getCodeTemplate, matchApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { type SupportedLanguage } from '@/constants';
import {
  SubmissionProgress,
  TestCaseDetailMessage,
  SubmissionStatusMessage,
} from '@/types/websocket';
import { createErrorHandler } from '@/lib/error-tracking';
import { WEBSOCKET_MESSAGE_TYPES } from '@/constants/websocket';
import { useToast } from '@/components/ui/Toast';

interface UseGameRoomWebSocketProps {
  matchId: string;
  game: Game | null;
  myCode: string;
  selectedLanguage: SupportedLanguage;
  isTemplateSet: React.MutableRefObject<boolean>;
  setMyCode: (code: string) => void;
  setOpponentCode: (code: string) => void;
  setSubmitResult: (result: SubmitResult | null) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setSelectedLanguage: (language: SupportedLanguage) => void;
  setOpponentLanguage: (language: SupportedLanguage) => void;
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
  setIsSubmitting,
  setSelectedLanguage,
  setOpponentLanguage,
  setSubmissionProgress,
  refetchGame,
}: UseGameRoomWebSocketProps) => {
  const router = useRouter();
  const wsRef = useRef<WebSocketClient | null>(null);
  const { user: currentUser } = useAuthStore();
  const { showToast } = useToast();

  // Template setup
  useEffect(() => {
    if (game?.problem && !isTemplateSet.current && !myCode) {
      const template = getCodeTemplate(game.problem, selectedLanguage);
      setMyCode(template);
      isTemplateSet.current = true;
    }
  }, [game?.problem, isTemplateSet, myCode, selectedLanguage, setMyCode]);

  // Message type handlers
  const handleCodeUpdate = useCallback(
    (message: CodeUpdateMessage) => {
      // Handle both direct code field and data.code field
      const code = message.code || message.data?.code;
      if (code !== undefined) {
        // Only update opponent code if the message is from a different user
        if (message.user_id !== currentUser?.id) {
          setOpponentCode(code);
          // Update opponent language if provided
          const language = message.language || message.data?.language;
          if (language && language.trim() !== '') {
            // Normalize language value (lowercase)
            const normalizedLanguage = language.toLowerCase().trim();
            if (['python', 'javascript', 'go'].includes(normalizedLanguage)) {
              setOpponentLanguage(normalizedLanguage as SupportedLanguage);
            }
          }
        }
      }
    },
    [currentUser?.id, setOpponentCode, setOpponentLanguage]
  );

  const handleSubmissionStarted = useCallback(
    (message: SubmissionStatusMessage) => {
      // Only reflect my own submission progress in my UI
      if (message.user_id !== currentUser?.id) return;

      setIsSubmitting(true);
      setSubmissionProgress({
        isSubmitting: true,
        totalTestCases:
          message.total_test_cases || game?.problem?.test_cases?.length || 0,
        completedTestCases: 0,
        testCaseResults: Array.from({
          length:
            message.total_test_cases || game?.problem?.test_cases?.length || 0,
        }).map((_, i) => ({
          index: i,
          input: '',
          expectedOutput: '',
          status: 'pending' as const,
        })),
        statusMessage: 'Evaluating Solution...',
      });
    },
    [
      currentUser?.id,
      setIsSubmitting,
      setSubmissionProgress,
      game?.problem?.test_cases?.length,
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
          expectedOutput: message.expected_output ?? '',
          status: 'running' as const,
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
          expectedOutput: message.expected_output ?? message.expected ?? '',
          actualOutput: message.actual_output ?? message.actual,
          passed: message.passed,
          status: 'completed' as const,
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

      setIsSubmitting(false);
      setSubmissionProgress((prev: SubmissionProgress) => ({
        ...prev,
        isSubmitting: false,
        overallPassed: message.passed,
        executionTime: message.execution_time,
        memoryUsage: message.memory_usage,
        statusMessage: message.passed
          ? 'All test cases passed!'
          : 'Test cases failed.',
      }));

      // Toast notification for evaluation result
      if (message.passed) {
        showToast({
          title: 'Evaluation Complete',
          message: 'All test cases passed!',
          variant: 'success',
        });
      } else {
        const passedCount =
          (message as SubmissionStatusMessage & { passed_test_cases?: number })
            .passed_test_cases ?? 0;
        const totalCount =
          game?.problem?.test_cases?.length ??
          message.total_test_cases ??
          (message as SubmissionStatusMessage & { total?: number }).total ??
          0;

        showToast({
          title: 'Evaluation Result',
          message: `${passedCount}/${totalCount} test cases passed`,
          variant: 'error',
        });
      }

      // If all test cases passed, check if game is finished (for single player games)
      if (message.passed) {
        setSubmitResult({
          success: true,
          message: 'All test cases passed!',
          is_winner: true,
        });
        // Refresh game data to check if game status is 'finished'
        refetchGame();
      }
    },
    [
      currentUser?.id,
      setIsSubmitting,
      setSubmissionProgress,
      setSubmitResult,
      refetchGame,
      game?.problem?.test_cases?.length,
      showToast,
    ]
  );

  const handleSubmissionFailed = useCallback(
    (message: SubmissionStatusMessage) => {
      if (message.user_id !== currentUser?.id) return;

      setIsSubmitting(false);
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
    [currentUser?.id, setIsSubmitting, setSubmissionProgress, setSubmitResult]
  );

  const handleGameFinished = useCallback(
    (winnerId?: string) => {
      if (winnerId) {
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

  const handleError = useCallback(
    (errorMessage?: string) => {
      setSubmitResult({
        success: false,
        message: errorMessage || 'An error occurred during the game.',
        is_winner: false,
      });
    },
    [setSubmitResult]
  );

  // WebSocket message handler with type guards
  const handleWebSocketMessage = useCallback(
    (message: WebSocketMessage) => {
      switch (message.type) {
        case WEBSOCKET_MESSAGE_TYPES.CODE_UPDATE:
          if (isCodeUpdateMessage(message)) {
            handleCodeUpdate(message);
          }
          break;

        case WEBSOCKET_MESSAGE_TYPES.SUBMISSION_STARTED:
          if (isSubmissionStartedMessage(message)) {
            handleSubmissionStarted(unwrapSubmissionMessage(message));
          }
          break;

        case WEBSOCKET_MESSAGE_TYPES.TEST_CASE_RUNNING:
          if (isTestCaseRunningMessage(message)) {
            handleTestCaseRunning(unwrapTestCaseMessage(message));
          }
          break;

        case WEBSOCKET_MESSAGE_TYPES.TEST_CASE_COMPLETED:
          if (isTestCaseCompletedMessage(message)) {
            handleTestCaseCompleted(unwrapTestCaseMessage(message));
          }
          break;

        case WEBSOCKET_MESSAGE_TYPES.SUBMISSION_COMPLETED:
          if (isSubmissionCompletedMessage(message)) {
            handleSubmissionCompleted(unwrapSubmissionMessage(message));
          }
          break;

        case WEBSOCKET_MESSAGE_TYPES.SUBMISSION_FAILED:
          if (isSubmissionFailedMessage(message)) {
            handleSubmissionFailed(unwrapSubmissionMessage(message));
          }
          break;

        case WEBSOCKET_MESSAGE_TYPES.GAME_FINISHED:
          if (isGameFinishedMessage(message)) {
            handleGameFinished(message.winner_id);
          }
          break;

        case WEBSOCKET_MESSAGE_TYPES.ERROR:
          handleError();
          break;

        case WEBSOCKET_MESSAGE_TYPES.JUDGE0_TIMEOUT_ERROR:
        case WEBSOCKET_MESSAGE_TYPES.JUDGE0_QUOTA_ERROR:
          if (isErrorMessage(message)) {
            handleError(message.message);
          }
          break;

        default:
          if (process.env.NODE_ENV === 'development') {
            console.log('Unknown message type:', message.type);
          }
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

    // Require auth token before opening WebSocket connection
    const token =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('authToken')
        : null;

    if (!token) {
      // If token is missing, show a gentle notification and skip WS connection
      showToast({
        title: 'Authentication Required',
        message:
          'Your session has expired or you are not logged in. Please log in again and try submitting.',
        variant: 'error',
      });
      return;
    }

    const wsClient = new WebSocketClient(matchId);

    wsClient.addMessageHandler(handleWebSocketMessage);

    wsRef.current = wsClient;

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [
    game,
    matchId,
    router,
    handleWebSocketMessage,
    setSubmitResult,
    showToast,
  ]);

  // Code change handler
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setMyCode(newCode);

      if (wsRef.current) {
        wsRef.current.sendCodeUpdate(newCode, selectedLanguage);
      }
    },
    [setMyCode, selectedLanguage]
  );

  // Language change handler
  const handleLanguageChange = useCallback(
    (newLanguage: SupportedLanguage) => {
      setIsSubmitting(false);
      setSubmitResult(null);
      setSelectedLanguage(newLanguage);

      if (game?.problem) {
        const template = getCodeTemplate(game.problem, newLanguage);
        setMyCode(template);

        if (wsRef.current) {
          wsRef.current.sendCodeUpdate(template, newLanguage);
        }
      }
    },
    [
      game?.problem,
      setMyCode,
      setIsSubmitting,
      setSubmitResult,
      setSelectedLanguage,
    ]
  );

  // Code submission handler
  const handleSubmitCode = useCallback(async () => {
    if (!game) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const result = await matchApi.submitSolution(
        matchId,
        myCode,
        selectedLanguage
      );

      if (result.success) {
        setSubmitResult({
          success: true,
          message: result.data.is_winner
            ? 'Congratulations! You won!'
            : 'Solution submitted successfully.',
          is_winner: result.data.is_winner || false,
        });
      } else {
        setSubmitResult({
          success: false,
          message: result.message || 'Submission failed.',
          is_winner: false,
        });
      }
    } catch (error) {
      const errorHandler = createErrorHandler(
        'useGameRoomWebSocket',
        'submitSolution'
      );
      errorHandler(error, {
        matchId,
        language: selectedLanguage,
      });
      setSubmitResult({
        success: false,
        message: 'Network error occurred.',
        is_winner: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    game,
    matchId,
    myCode,
    selectedLanguage,
    setIsSubmitting,
    setSubmitResult,
  ]);

  return {
    handleCodeChange,
    handleLanguageChange,
    handleSubmitCode,
  };
};
