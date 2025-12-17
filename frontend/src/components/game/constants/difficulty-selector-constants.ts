// Difficulty Selector related constants
import { TIMER_CONSTANTS, DIFFICULTY_CONFIG } from '@/constants';
export const DIFFICULTY_SELECTOR_CONSTANTS = {
  // Difficulty options (using shared DIFFICULTY_CONFIG)
  DIFFICULTY_OPTIONS: [
    {
      value: DIFFICULTY_CONFIG.Easy.value,
      label: DIFFICULTY_CONFIG.Easy.label,
      color: DIFFICULTY_CONFIG.Easy.color,
      description: DIFFICULTY_CONFIG.Easy.description,
    },
    {
      value: DIFFICULTY_CONFIG.Medium.value,
      label: DIFFICULTY_CONFIG.Medium.label,
      color: DIFFICULTY_CONFIG.Medium.color,
      description: DIFFICULTY_CONFIG.Medium.description,
    },
    {
      value: DIFFICULTY_CONFIG.Hard.value,
      label: DIFFICULTY_CONFIG.Hard.label,
      color: DIFFICULTY_CONFIG.Hard.color,
      description: DIFFICULTY_CONFIG.Hard.description,
    },
  ] as const,

  // Messages
  MESSAGES: {
    TITLE: '🏁 Code Racer',
    SUBTITLE: 'Choose Your Racing Circuit',
    DESCRIPTION: 'Compete against friends or racers worldwide!',
    SUB_DESCRIPTION:
      '💨 Select your preferred speed circuit and let the coding race begin!',
  },

  // Layout
  LAYOUT: {
    CONTAINER_MAX_WIDTH: 'max-w-4xl',
    CONTAINER_PADDING: 'p-6',
    TITLE_SIZE: 'text-5xl font-bold mb-4',
    SUBTITLE_SIZE: 'text-2xl font-semibold mb-4',
    DESCRIPTION_SIZE: 'text-lg font-medium',
    SUB_DESCRIPTION_SIZE: 'text-base',
    GRID_COLS: 'grid-cols-1 md:grid-cols-3',
    GRID_GAP: 'gap-6',
    CARD_PADDING: 'p-6',
    CARD_TITLE_SIZE: 'text-2xl font-bold mb-2',
  },

  // Styling
  STYLES: {
    GRADIENT_TEXT:
      'bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent',
    CARD_HOVER: 'hover:scale-105',
    TRANSITION: `transition-all duration-${TIMER_CONSTANTS.UI_DELAYS.MEDIUM} transform`,
  },
} as const;
