import React from 'react';

interface PageSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PageSpinner: React.FC<PageSpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8 border-2',
    md: 'h-12 w-12 border-b-2',
    lg: 'h-16 w-16 border-b-2',
  };

  return (
    <div
      className={`animate-spin rounded-full border-blue-600 ${sizeClasses[size]} ${className}`}
    />
  );
};

export default PageSpinner;


