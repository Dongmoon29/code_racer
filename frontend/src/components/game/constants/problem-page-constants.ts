// Problem Page 관련 상수 정의
export const PROBLEM_PAGE_CONSTANTS = {
  // 기본값
  DEFAULTS: {
    LANGUAGE: 'javascript' as const,
    THEME: 'dark' as const,
  },
  
  // 언어 옵션
  LANGUAGE_OPTIONS: [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'go', label: 'Go' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
  ] as const,
  
  // 메시지
  MESSAGES: {
    LANGUAGE_CHANGE_CONFIRMATION: 'Changing language will reset your code to template. Continue?',
  },
  
  // 레이아웃
  LAYOUT: {
    CONTAINER_CLASS: 'flex h-full',
    PROBLEM_SECTION_CLASS: 'w-1/2 p-4',
    EDITOR_SECTION_CLASS: 'w-1/2 p-4',
    TITLE_SIZE: 'text-2xl font-bold',
    DESCRIPTION_MARGIN: 'mt-4',
    SELECT_MARGIN: 'mb-4',
  },
} as const;
