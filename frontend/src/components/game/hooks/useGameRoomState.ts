import { useState, useEffect, useRef } from 'react';
import { Game, SubmitResult } from '@/types';
import { GAME_ROOM_CONSTANTS, createSessionStorageKey } from '../constants/game-room-constants';

interface UseGameRoomStateProps {
  matchId: string;
}

interface UseGameRoomStateReturn {
  // Game state
  game: Game | null;
  setGame: (game: Game | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  
  // Code state
  myCode: string;
  setMyCode: (code: string) => void;
  opponentCode: string;
  setOpponentCode: (code: string) => void;
  
  // Submission state
  submitResult: SubmitResult | null;
  setSubmitResult: (result: SubmitResult | null) => void;
  submitting: boolean;
  setSubmitting: (submitting: boolean) => void;
  
  // Language and UI state
  selectedLanguage: 'python' | 'javascript' | 'go';
  setSelectedLanguage: (language: 'python' | 'javascript' | 'go') => void;
  showMyCode: boolean;
  setShowMyCode: (show: boolean) => void;
  showOpponentCode: boolean;
  setShowOpponentCode: (show: boolean) => void;
  
  // Template setup state
  isTemplateSet: React.MutableRefObject<boolean>;
}

export const useGameRoomState = ({ matchId }: UseGameRoomStateProps): UseGameRoomStateReturn => {
  // Game state
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Code state
  const [myCode, setMyCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const key = createSessionStorageKey(matchId, GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.CODE);
      return sessionStorage.getItem(key) || GAME_ROOM_CONSTANTS.DEFAULTS.EMPTY_CODE;
    }
    return GAME_ROOM_CONSTANTS.DEFAULTS.EMPTY_CODE;
  });
  
  const [opponentCode, setOpponentCode] = useState<string>(GAME_ROOM_CONSTANTS.DEFAULTS.EMPTY_CODE);
  
  // Submission state
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Language and UI state
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
  
  // Template setup state
  const isTemplateSet = useRef(false);
  
  // Session storage synchronization
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
    // Game state
    game,
    setGame,
    loading,
    setLoading,
    error,
    setError,
    
    // Code state
    myCode,
    setMyCode,
    opponentCode,
    setOpponentCode,
    
    // Submission state
    submitResult,
    setSubmitResult,
    submitting,
    setSubmitting,
    
    // Language and UI state
    selectedLanguage,
    setSelectedLanguage,
    showMyCode,
    setShowMyCode,
    showOpponentCode,
    setShowOpponentCode,
    
    // Template setup state
    isTemplateSet,
  };
};
