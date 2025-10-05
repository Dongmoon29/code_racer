import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import WebSocketClient, {
  WebSocketMessage,
  CodeUpdateMessage,
} from '@/lib/websocket';
import { Game, SubmitResult } from '@/types';
import { getCodeTemplate } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface UseGameRoomWebSocketProps {
  matchId: string;
  game: Game | null;
  myCode: string;
  selectedLanguage: 'python' | 'javascript' | 'go';
  isTemplateSet: React.MutableRefObject<boolean>;
  setMyCode: (code: string) => void;
  setOpponentCode: (code: string) => void;
  setSubmitResult: (result: SubmitResult | null) => void;
  setSubmitting: (submitting: boolean) => void;
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

        case 'game_finished':
          if (message.winner_id) {
            setSubmitResult({
              success: true,
              message: 'Game finished!',
              is_winner: false, // This will be determined by the actual game logic
            });
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
    [setOpponentCode, setSubmitResult]
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
    (newLanguage: 'python' | 'javascript' | 'go') => {
      setSubmitting(false);
      setSubmitResult(null);

      if (game?.leetcode) {
        const template = getCodeTemplate(game.leetcode, newLanguage);
        setMyCode(template);

        if (wsRef.current) {
          wsRef.current.sendCodeUpdate(template);
        }
      }
    },
    [game?.leetcode, setMyCode, setSubmitting, setSubmitResult]
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
