// GameRoom related constants
export const GAME_ROOM_CONSTANTS = {
  // Session storage keys
  SESSION_STORAGE_KEYS: {
    CODE: 'code',
    LANGUAGE: 'language',
    SHOW_MY_CODE: 'showMyCode',
    SHOW_OPPONENT_CODE: 'showOpponentCode',
  },
  
  // Default values
  DEFAULTS: {
    LANGUAGE: 'javascript' as const,
    SHOW_MY_CODE: true,
    SHOW_OPPONENT_CODE: true,
    EMPTY_CODE: '',
  },
  
  // Game status
  GAME_STATUS: {
    WAITING: 'waiting',
    PLAYING: 'playing',
    FINISHED: 'finished',
    CLOSED: 'closed',
  } as const,
  
  // Language options
  SUPPORTED_LANGUAGES: ['python', 'javascript', 'go'] as const,
  
  // Messages
  MESSAGES: {
    GAME_INITIALIZING: 'Setting up your match...',
    GAME_CLOSED: 'This game room has been closed by the creator.',
    INVALID_GAME_STATE: 'The game is in an invalid state.',
    BACK_TO_DASHBOARD: 'Back to dashboard',
  },
} as const;

// Session storage key generation helper
export const createSessionStorageKey = (matchId: string, key: string): string => 
  `match_${matchId}_${key}`;
