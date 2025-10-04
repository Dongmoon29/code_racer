import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import WebSocketClient, { WebSocketMessage, CodeUpdateMessage } from '@/lib/websocket';
import { Game, SubmitResult } from '@/types';
import { getCodeTemplate } from '@/lib/api';
import { GAME_ROOM_CONSTANTS } from '../constants/game-room-constants';

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
  
  // 템플릿 설정
  useEffect(() => {
    if (game?.leetcode && !isTemplateSet.current && !myCode) {
      const template = getCodeTemplate(game.leetcode, selectedLanguage);
      setMyCode(template);
      isTemplateSet.current = true;
    }
  }, [game?.leetcode, isTemplateSet, myCode, selectedLanguage, setMyCode]);
  
  // WebSocket 메시지 핸들러
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'code_update':
        const codeUpdateMessage = message as CodeUpdateMessage;
        if (codeUpdateMessage.code !== undefined) {
          setOpponentCode(codeUpdateMessage.code);
        }
        break;
        
      case 'game_finished':
        if (message.winner_id) {
          setSubmitResult({
            success: true,
            message: 'Game finished!',
          });
        }
        break;
        
      case 'error':
        setSubmitResult({
          success: false,
          message: 'An error occurred during the game.',
        });
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  }, [setOpponentCode, setSubmitResult]);
  
  // WebSocket 연결 설정
  useEffect(() => {
    if (!game) return;
    
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/ws/${matchId}?token=${token}`;
    const wsClient = new WebSocketClient(wsUrl);
    
    wsClient.onMessage = handleWebSocketMessage;
    wsClient.onError = (error) => {
      console.error('WebSocket error:', error);
      setSubmitResult({
        success: false,
        message: 'Connection error occurred.',
      });
    };
    
    wsRef.current = wsClient;
    
    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [game, matchId, router, handleWebSocketMessage, setSubmitResult]);
  
  // 코드 변경 핸들러
  const handleCodeChange = useCallback((newCode: string) => {
    setMyCode(newCode);
    
    if (wsRef.current) {
      const message: CodeUpdateMessage = {
        type: 'code_update',
        game_id: matchId,
        code: newCode,
      };
      wsRef.current.sendMessage(message);
    }
  }, [matchId, setMyCode]);
  
  // 언어 변경 핸들러
  const handleLanguageChange = useCallback((newLanguage: 'python' | 'javascript' | 'go') => {
    setSubmitting(false);
    setSubmitResult(null);
    
    if (game?.leetcode) {
      const template = getCodeTemplate(game.leetcode, newLanguage);
      setMyCode(template);
      
      if (wsRef.current) {
        const message: CodeUpdateMessage = {
          type: 'code_update',
          game_id: matchId,
          code: template,
        };
        wsRef.current.sendMessage(message);
      }
    }
  }, [game?.leetcode, matchId, setMyCode, setSubmitting, setSubmitResult]);
  
  // 코드 제출 핸들러
  const handleSubmitCode = useCallback(async () => {
    if (!game || submitting) return;
    
    setSubmitting(true);
    setSubmitResult(null);
    
    try {
      const response = await fetch(`/api/matches/${matchId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
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
          message: result.is_winner ? 'Congratulations! You won!' : 'Solution submitted successfully.',
        });
      } else {
        setSubmitResult({
          success: false,
          message: result.message || 'Submission failed.',
        });
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: 'Network error occurred.',
      });
    } finally {
      setSubmitting(false);
    }
  }, [game, matchId, myCode, selectedLanguage, submitting, setSubmitting, setSubmitResult]);
  
  return {
    handleCodeChange,
    handleLanguageChange,
    handleSubmitCode,
  };
};
