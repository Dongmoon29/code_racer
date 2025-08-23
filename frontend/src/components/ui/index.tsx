import React from 'react';

// Spinner 컴포넌트
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'currentColor',
}) => {
  const sizeValues = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <svg
      className={`animate-spin ${sizeValues[size]}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill={color}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Legacy Tailwind CSS components
export { Button } from './Button';
export { Card } from './Card';
export { Alert, AlertTitle, AlertDescription } from './alert';
export { default as Loading } from './Loading';
export { Select } from './Select';
export { ThemeToggle } from './ThemeToggle';

// New Styled Components
export { default as ButtonStyled } from './Button.new';
export { default as CardStyled } from './Card.new';
export { default as AlertStyled } from './Alert.new';
export { default as LoadingStyled } from './Loading.new';
export { default as SelectStyled } from './Select.new';
export { default as ThemeToggleStyled } from './ThemeToggle.new';

// Styled Components exports
export * from './Button.styled';
export * from './Card.styled';
export * from './Alert.styled';
export * from './Loading.styled';
export * from './Select.styled';
export * from './ThemeToggle.styled';
