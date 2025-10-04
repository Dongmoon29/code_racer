// Difficulty Selector related constants
export const DIFFICULTY_SELECTOR_CONSTANTS = {
  // Difficulty options
  DIFFICULTY_OPTIONS: [
    {
      value: 'Easy',
      label: 'Easy',
      color: 'text-green-600',
      description: 'Perfect for beginners',
    },
    {
      value: 'Medium',
      label: 'Medium',
      color: 'text-yellow-600',
      description: 'Balanced challenge',
    },
    {
      value: 'Hard',
      label: 'Hard',
      color: 'text-red-600',
      description: 'Expert level',
    },
  ] as const,
  
  // Messages
  MESSAGES: {
    TITLE: '🏁 Code Racer',
    SUBTITLE: 'Choose Your Racing Circuit',
    DESCRIPTION: 'Compete against friends or racers worldwide!',
    SUB_DESCRIPTION: '💨 Select your preferred speed circuit and let the coding race begin!',
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
    GRADIENT_TEXT: 'bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent',
    CARD_HOVER: 'hover:scale-105',
    TRANSITION: 'transition-all duration-200 transform',
  },
} as const;
