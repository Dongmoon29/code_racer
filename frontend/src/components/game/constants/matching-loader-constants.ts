// Matching Loader related constants
import { TIMER_CONSTANTS } from '@/constants';
export const MATCHING_LOADER_CONSTANTS = {
  // Difficulty-specific configuration
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

  // Timer settings
  TIMER: {
    INTERVAL_MS: TIMER_CONSTANTS.INTERVALS.SECOND,
    INCREMENT_VALUE: 1,
  },

  // Messages
  MESSAGES: {
    SEARCHING_FOR_OPPONENT: 'Searching for opponent...',
    WAIT_TIME_PREFIX: 'Wait time:',
    CANCEL_MATCHMAKING: 'Cancel Matchmaking',
  },

  // Styling
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
