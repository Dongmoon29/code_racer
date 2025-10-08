import {
  useState,
  useEffect,
  useRef,
  useCallback,
  Dispatch,
  SetStateAction,
} from 'react';
import { Game, SubmitResult } from '@/types';
import { SubmissionProgress, TestCaseResult } from '@/types/websocket';
import {
  GAME_ROOM_CONSTANTS,
  createSessionStorageKey,
} from '../constants/game-room-constants';
import {
  useSessionStorageManager,
  useDebouncedSessionStorage,
} from '@/hooks/useSessionStorage';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/constants';

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
  submissionProgress: SubmissionProgress;
  setSubmissionProgress: Dispatch<SetStateAction<SubmissionProgress>>;

  // Language and UI state
  selectedLanguage: SupportedLanguage;
  setSelectedLanguage: (language: SupportedLanguage) => void;
  showMyCode: boolean;
  setShowMyCode: (show: boolean) => void;
  showOpponentCode: boolean;
  setShowOpponentCode: (show: boolean) => void;

  // Template setup state
  isTemplateSet: React.MutableRefObject<boolean>;
}

export const useGameRoomState = ({
  matchId,
}: UseGameRoomStateProps): UseGameRoomStateReturn => {
  // Session storage manager
  const storageManager = useSessionStorageManager();

  // Game state
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Code state with session storage initialization
  const [myCode, setMyCode] = useState<string>(() => {
    const key = createSessionStorageKey(
      matchId,
      GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.CODE
    );
    return (
      storageManager.getItem(key) || GAME_ROOM_CONSTANTS.DEFAULTS.EMPTY_CODE
    );
  });

  const [opponentCode, setOpponentCode] = useState<string>(
    GAME_ROOM_CONSTANTS.DEFAULTS.EMPTY_CODE
  );

  // Submission state
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionProgress, setSubmissionProgress] =
    useState<SubmissionProgress>({
      isSubmitting: false,
      totalTestCases: 0,
      completedTestCases: 0,
      testCaseResults: [],
    });

  // Language and UI state with session storage initialization
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(
    () => {
      const key = createSessionStorageKey(
        matchId,
        GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.LANGUAGE
      );
      const stored = storageManager.getItem(key) as SupportedLanguage;
      return stored || SUPPORTED_LANGUAGES.JAVASCRIPT;
    }
  );

  const [showMyCode, setShowMyCode] = useState<boolean>(() => {
    const key = createSessionStorageKey(
      matchId,
      GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.SHOW_MY_CODE
    );
    return storageManager.getItem(key) !== 'false';
  });

  const [showOpponentCode, setShowOpponentCode] = useState<boolean>(() => {
    const key = createSessionStorageKey(
      matchId,
      GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.SHOW_OPPONENT_CODE
    );
    return storageManager.getItem(key) !== 'false';
  });

  // Template setup state
  const isTemplateSet = useRef(false);

  // Debounced session storage updates to prevent excessive writes
  useDebouncedSessionStorage(
    createSessionStorageKey(
      matchId,
      GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.CODE
    ),
    myCode,
    300
  );

  useDebouncedSessionStorage(
    createSessionStorageKey(
      matchId,
      GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.LANGUAGE
    ),
    selectedLanguage,
    300
  );

  useDebouncedSessionStorage(
    createSessionStorageKey(
      matchId,
      GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.SHOW_MY_CODE
    ),
    String(showMyCode),
    300
  );

  useDebouncedSessionStorage(
    createSessionStorageKey(
      matchId,
      GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.SHOW_OPPONENT_CODE
    ),
    String(showOpponentCode),
    300
  );

  // Cleanup function for external use
  const cleanup = useCallback(() => {
    storageManager.cleanup();
  }, [storageManager]);

  // Expose cleanup function
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

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
    submissionProgress,
    setSubmissionProgress,

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
