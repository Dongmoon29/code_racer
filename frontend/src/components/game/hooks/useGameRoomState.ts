import { useState, useRef, Dispatch, SetStateAction } from "react";
import { SubmissionProgress } from "@/types/websocket";
import {
  GAME_ROOM_CONSTANTS,
  createSessionStorageKey,
} from "../constants/game-room-constants";
import { useDebouncedSessionStorage } from "@/hooks/useSessionStorage";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/constants";

interface UseGameRoomStateProps {
  matchId: string;
}

interface UseGameRoomStateReturn {
  // Code state
  myCode: string;
  setMyCode: (code: string) => void;
  opponentCode: string;
  setOpponentCode: (code: string) => void;

  // Submission state
  isSubmitting: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
  submissionProgress: SubmissionProgress;
  setSubmissionProgress: Dispatch<SetStateAction<SubmissionProgress>>;

  // Language and UI state
  selectedLanguage: SupportedLanguage;
  setSelectedLanguage: (language: SupportedLanguage) => void;
  opponentLanguage: SupportedLanguage;
  setOpponentLanguage: (language: SupportedLanguage) => void;

  // Template setup state
  isTemplateSet: React.MutableRefObject<boolean>;
}

export const useGameRoomState = ({
  matchId,
}: UseGameRoomStateProps): UseGameRoomStateReturn => {
  // Code state with session storage initialization
  const [myCode, setMyCode] = useState<string>(() => {
    const key = createSessionStorageKey(
      matchId,
      GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.CODE,
    );
    return (
      (typeof window !== "undefined" ? sessionStorage.getItem(key) : null) ||
      GAME_ROOM_CONSTANTS.DEFAULTS.EMPTY_CODE
    );
  });

  const [opponentCode, setOpponentCode] = useState<string>(
    GAME_ROOM_CONSTANTS.DEFAULTS.EMPTY_CODE,
  );

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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
        GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.LANGUAGE,
      );
      const stored =
        typeof window !== "undefined"
          ? (sessionStorage.getItem(key) as SupportedLanguage | null)
          : null;
      return stored || SUPPORTED_LANGUAGES.JAVASCRIPT;
    },
  );

  const [opponentLanguage, setOpponentLanguage] = useState<SupportedLanguage>(
    SUPPORTED_LANGUAGES.JAVASCRIPT,
  );

  // Template setup state
  const isTemplateSet = useRef(false);

  // Debounced session storage updates to prevent excessive writes
  useDebouncedSessionStorage(
    createSessionStorageKey(
      matchId,
      GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.CODE,
    ),
    myCode,
    300,
  );

  useDebouncedSessionStorage(
    createSessionStorageKey(
      matchId,
      GAME_ROOM_CONSTANTS.SESSION_STORAGE_KEYS.LANGUAGE,
    ),
    selectedLanguage,
    300,
  );

  return {
    // Code state
    myCode,
    setMyCode,
    opponentCode,
    setOpponentCode,

    // Submission state
    isSubmitting,
    setIsSubmitting,
    submissionProgress,
    setSubmissionProgress,

    // Language and UI state
    selectedLanguage,
    setSelectedLanguage,
    opponentLanguage,
    setOpponentLanguage,

    // Template setup state
    isTemplateSet,
  };
};
