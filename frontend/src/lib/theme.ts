export const theme = {
  colors: {
    // Background colors
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',

    // Card colors
    card: 'hsl(var(--card))',
    cardForeground: 'hsl(var(--card-foreground))',

    // Header colors
    header: 'hsl(var(--header))',

    // Popover colors
    popover: 'hsl(var(--popover))',
    popoverForeground: 'hsl(var(--popover-foreground))',

    // Primary colors
    primary: 'hsl(var(--primary))',
    primaryHover: 'hsl(var(--primary-hover))',
    primaryForeground: 'hsl(var(--primary-foreground))',

    // Secondary colors
    secondary: 'hsl(var(--secondary))',
    secondaryForeground: 'hsl(var(--secondary-foreground))',

    // Muted colors
    muted: 'hsl(var(--muted))',
    mutedForeground: 'hsl(var(--muted-foreground))',

    // Accent colors
    accent: 'hsl(var(--accent))',
    accentForeground: 'hsl(var(--accent-foreground))',

    // Destructive colors
    destructive: 'hsl(var(--destructive))',

    // Border colors
    border: 'hsl(var(--border))',
    input: 'hsl(var(--input))',
    ring: 'hsl(var(--ring))',

    // Neon gradient colors
    neonGradient: 'var(--neon-gradient)',
    neonHoverGradient: 'var(--neon-hover-gradient)',
    neonShadow: 'var(--neon-shadow)',

    // Light gradient colors
    lightGradient: 'var(--light-gradient)',
    lightHoverGradient: 'var(--light-hover-gradient)',
    lightShadow: 'var(--light-shadow)',
  },

  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '3rem', // 48px
    '3xl': '4rem', // 64px
  },

  borderRadius: {
    sm: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.625rem', // 10px
    xl: '0.75rem', // 12px
    full: '9999px',
  },

  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },

  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
};

export type Theme = typeof theme;

// CSS 변수와 함께 사용할 수 있는 유틸리티 함수
export const cssVar = (name: string) => `var(--${name})`;

// 반응형 미디어 쿼리 헬퍼
export const media = {
  sm: `@media (min-width: ${theme.breakpoints.sm})`,
  md: `@media (min-width: ${theme.breakpoints.md})`,
  lg: `@media (min-width: ${theme.breakpoints.lg})`,
  xl: `@media (min-width: ${theme.breakpoints.xl})`,
  '2xl': `@media (min-width: ${theme.breakpoints['2xl']})`,
};
