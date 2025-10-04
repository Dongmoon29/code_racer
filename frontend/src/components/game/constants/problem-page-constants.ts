// Problem Page related constants
export const PROBLEM_PAGE_CONSTANTS = {
  // Default values
  DEFAULTS: {
    LANGUAGE: 'javascript' as const,
    THEME: 'dark' as const,
  },
  
  // Language options
  LANGUAGE_OPTIONS: [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'go', label: 'Go' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
  ] as const,
  
  // Messages
  MESSAGES: {
    LANGUAGE_CHANGE_CONFIRMATION: 'Changing language will reset your code to template. Continue?',
  },
  
  // Layout
  LAYOUT: {
    CONTAINER_CLASS: 'flex h-full',
    PROBLEM_SECTION_CLASS: 'w-1/2 p-4',
    EDITOR_SECTION_CLASS: 'w-1/2 p-4',
    TITLE_SIZE: 'text-2xl font-bold',
    DESCRIPTION_MARGIN: 'mt-4',
    SELECT_MARGIN: 'mb-4',
  },
} as const;
