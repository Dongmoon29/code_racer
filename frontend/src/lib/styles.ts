/**
 * 공통 스타일 상수 및 유틸리티
 * 레이아웃, 패딩, 마진 등 일관된 스타일링을 위한 상수 정의
 */

// 레이아웃 패딩
export const LAYOUT_PADDING = {
  // 페이지 컨테이너 패딩
  PAGE_VERTICAL: 'py-6',
  PAGE_HORIZONTAL: 'px-4 md:px-8',
  PAGE_FULL: 'p-4 md:p-8',
  
  // 섹션 패딩
  SECTION: 'py-8',
  SECTION_SMALL: 'py-4',
  
  // 카드/컨테이너 패딩
  CARD: 'p-6',
  CARD_SMALL: 'p-4',
  CARD_LARGE: 'p-8',
} as const;

// 레이아웃 마진
export const LAYOUT_MARGIN = {
  SECTION: 'mb-8',
  SECTION_SMALL: 'mb-4',
  ELEMENT: 'mb-6',
  ELEMENT_SMALL: 'mb-2',
} as const;

// 레이아웃 너비
export const LAYOUT_WIDTH = {
  CONTAINER: 'max-w-7xl',
  CONTAINER_SMALL: 'max-w-3xl',
  CONTAINER_MEDIUM: 'max-w-4xl',
  CONTAINER_LARGE: 'max-w-7xl',
  FULL: 'w-full',
} as const;

// 간격 (Gap)
export const LAYOUT_GAP = {
  SMALL: 'gap-2',
  MEDIUM: 'gap-4',
  LARGE: 'gap-6',
  XLARGE: 'gap-8',
} as const;

// 버튼 스타일
export const BUTTON_STYLES = {
  ICON_BUTTON: {
    BASE: 'p-1.5 rounded-md shrink-0 cursor-pointer transition-all duration-150',
    TEXT: 'text-[var(--gray-11)]',
    HOVER: 'hover:bg-[var(--gray-4)] hover:text-[var(--color-text)] hover:shadow-sm hover:scale-105',
  },
} as const;

// 네비게이션 스타일
export const NAVIGATION_STYLES = {
  LINK: {
    BASE: 'text-sm font-medium transition-colors',
    DEFAULT: 'text-[var(--gray-11)]',
    HOVER: 'hover:text-[var(--accent-9)]',
    ACTIVE: 'text-[var(--accent-9)]',
  },
} as const;

// 사이드바 스타일
export const SIDEBAR_STYLES = {
  NAV_PADDING: 'px-2 py-3',
  NAV_GAP: 'space-y-1',
} as const;

