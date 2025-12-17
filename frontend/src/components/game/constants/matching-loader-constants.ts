// Matching Loader related constants
import { TIMER_CONSTANTS, DIFFICULTY_CONFIG } from '@/constants';
export const MATCHING_LOADER_CONSTANTS = {
  // Difficulty-specific configuration (using shared DIFFICULTY_CONFIG)
  DIFFICULTY_CONFIG: {
    Easy: {
      color: DIFFICULTY_CONFIG.Easy.color,
      bgColor: DIFFICULTY_CONFIG.Easy.bgColor,
      icon: DIFFICULTY_CONFIG.Easy.icon,
    },
    Medium: {
      color: DIFFICULTY_CONFIG.Medium.color,
      bgColor: DIFFICULTY_CONFIG.Medium.bgColor,
      icon: DIFFICULTY_CONFIG.Medium.icon,
    },
    Hard: {
      color: DIFFICULTY_CONFIG.Hard.color,
      bgColor: DIFFICULTY_CONFIG.Hard.bgColor,
      icon: DIFFICULTY_CONFIG.Hard.icon,
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
