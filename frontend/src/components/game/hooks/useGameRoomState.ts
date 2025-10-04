import { useState, useEffect, useRef } from 'react';
import { Game, SubmitResult } from '@/types';
import { GAME_ROOM_CONSTANTS, createSessionStorageKey } from '../constants/game-room-constants';

interface UseGameRoomStateProps {
  matchId: string;
}

interface UseGameRoomStateReturn {
  // 게임 상태
  game: Game | null;
  setGame: (game: Game | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  
  // 코드 상태
  myCode: string;
  setMyCode: (code: string) => void;
  opponentCode: string;
  setOpponentCode: (code: string) => void;
  
  // 제출 상태
  submitResult: SubmitResult | null;
  setSubmitResult: (result: SubmitResult | null) => void;
  submitting: boolean;
  setSubmitting: (submitting: boolean) => void;
  
  // 언어 및 UI 상태
  selectedLanguage: 'python' | 'javascript' | 'go';
  setSelectedLanguage: (language: 'python' | 'javascript' | 'go') => void;
  showMyCode: boolean;
  setShowMyCode: (show: boolean) => void;
  showOpponentCode: boolean;
  setShowOpponentCode: (show: boolean) => void;
  
  // 템플릿 설정 상태
  isTemplateSet: React.MutableRefObject<boolean>;
}

export const useGameRoomState = ({ matchId }: UseGameRoomStateProps): UseGameRoomStateReturn => {
  // 게임 상태
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 코드 상태
  const [myCode, setMyCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const key = createSessionStorageKey(matchId, GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.CODE);
      return sessionStorage.getItem(key) || GAME_ROOM_CONSTANTS.DEFAULTS.EMPTY_CODE;
    }
    return GAME_ROOM_CONSTANTS.DEFAULTS.EMPTY_CODE;
  });
  
  const [opponentCode, setOpponentCode] = useState<string>(GAME_ROOM_CONSTANTS.DEFAULTS.EMPTY_CODE);
  
  // 제출 상태
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // 언어 및 UI 상태
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'javascript' | 'go'>(() => {
    if (typeof window !== 'undefined') {
      const key = createSessionStorageKey(matchId, GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.LANGUAGE);
      const stored = sessionStorage.getItem(key) as 'python' | 'javascript' | 'go';
      return stored || GAME_ROOM_CONSTANTS.DEFAULTS.LANGUAGE;
    }
    return GAME_ROOM_CONSTANTS.DEFAULTS.LANGUAGE;
  });
  
  const [showMyCode, setShowMyCode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const key = createSessionStorageKey(matchId, GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.SHOW_MY_CODE);
      return sessionStorage.getItem(key) !== 'false';
    }
    return GAME_ROOM_CONSTANTS.DEFAULTS.SHOW_MY_CODE;
  });
  
  const [showOpponentCode, setShowOpponentCode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const key = createSessionStorageKey(matchId, GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.SHOW_OPPONENT_CODE);
      return sessionStorage.getItem(key) !== 'false';
    }
    return GAME_ROOM_CONSTANTS.DEFAULTS.SHOW_OPPONENT_CODE;
  });
  
  // 템플릿 설정 상태
  const isTemplateSet = useRef(false);
  
  // 세션 스토리지 동기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = createSessionStorageKey(matchId, GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.CODE);
      sessionStorage.setItem(key, myCode);
    }
  }, [myCode, matchId]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = createSessionStorageKey(matchId, GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.LANGUAGE);
      sessionStorage.setItem(key, selectedLanguage);
    }
  }, [selectedLanguage, matchId]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = createSessionStorageKey(matchId, GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.SHOW_MY_CODE);
      sessionStorage.setItem(key, String(showMyCode));
    }
  }, [showMyCode, matchId]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = createSessionStorageKey(matchId, GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.SHOW_OPPONENT_CODE);
      sessionStorage.setItem(key, String(showOpponentCode));
    }
  }, [showOpponentCode, matchId]);
  
  return {
    // 게임 상태
    game,
    setGame,
    loading,
    setLoading,
    error,
    setError,
    
    // 코드 상태
    myCode,
    setMyCode,
    opponentCode,
    setOpponentCode,
    
    // 제출 상태
    submitResult,
    setSubmitResult,
    submitting,
    setSubmitting,
    
    // 언어 및 UI 상태
    selectedLanguage,
    setSelectedLanguage,
    showMyCode,
    setShowMyCode,
    showOpponentCode,
    setShowOpponentCode,
    
    // 템플릿 설정 상태
    isTemplateSet,
  };
};
