// GameRoom 관련 상수 정의
export const GAME_ROOM_CONSTANTS = {
  // 세션 스토리지 키
  SESSION_STORAGE_KEYS: {
    CODE: 'code',
    LANGUAGE: 'language',
    SHOW_MY_CODE: 'showMyCode',
    SHOW_OPPONENT_CODE: 'showOpponentCode',
  },
  
  // 기본값
  DEFAULTS: {
    LANGUAGE: 'javascript' as const,
    SHOW_MY_CODE: true,
    SHOW_OPPONENT_CODE: true,
    EMPTY_CODE: '',
  },
  
  // 게임 상태
  GAME_STATUS: {
    WAITING: 'waiting',
    PLAYING: 'playing',
    FINISHED: 'finished',
    CLOSED: 'closed',
  } as const,
  
  // 언어 옵션
  SUPPORTED_LANGUAGES: ['python', 'javascript', 'go'] as const,
  
  // 메시지
  MESSAGES: {
    GAME_INITIALIZING: 'Setting up your match...',
    GAME_CLOSED: 'This game room has been closed by the creator.',
    INVALID_GAME_STATE: 'The game is in an invalid state.',
    BACK_TO_DASHBOARD: 'Back to dashboard',
  },
} as const;

// 세션 스토리지 키 생성 헬퍼
export const createSessionStorageKey = (matchId: string, key: string): string => 
  `match_${matchId}_${key}`;
