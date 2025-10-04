// Matching Loader 관련 상수 정의
export const MATCHING_LOADER_CONSTANTS = {
  // 난이도별 설정
  DIFFICULTY_CONFIG: {
    Easy: {
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      icon: '🟢',
    },
    Medium: {
      color: 'text-yellow-700 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
      icon: '🟡',
    },
    Hard: {
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      icon: '🔴',
    },
  } as const,
  
  // 타이머 설정
  TIMER: {
    INTERVAL_MS: 1000,
    INCREMENT_VALUE: 1,
  },
  
  // 메시지
  MESSAGES: {
    SEARCHING_FOR_OPPONENT: 'Searching for opponent...',
    WAIT_TIME_PREFIX: 'Wait time:',
    CANCEL_MATCHMAKING: 'Cancel Matchmaking',
  },
  
  // 스타일링
  STYLES: {
    CONTAINER_MAX_WIDTH: 'max-w-2xl',
    CONTAINER_PADDING: 'p-6',
    CARD_PADDING: 'p-8',
    ICON_SIZE: 'text-6xl',
    TITLE_SIZE: 'text-2xl',
    SUBTITLE_SIZE: 'text-lg',
    BUTTON_PADDING: 'px-6 py-3',
  },
} as const;
