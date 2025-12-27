import React from 'react';

export type LoaderVariant = 'spinner' | 'fullscreen' | 'inline';
export type LoaderSize = 'sm' | 'md' | 'lg';

interface LoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize;
  message?: string;
  className?: string;
  spinnerColor?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  variant = 'spinner',
  size = 'md',
  message,
  className = '',
  spinnerColor,
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      spinner: 'w-4 h-4 border-2',
    },
    md: {
      spinner: 'w-6 h-6 border-2',
    },
    lg: {
      spinner: 'w-8 h-8 border-3',
    },
  };

  const config = sizeConfig[size];

  // Spinner component (used in spinner, inline, and fullscreen variants)
  const renderSpinner = () => {
    const colorClass =
      spinnerColor ||
      'border-t-blue-500 border-b-blue-500 border-r-transparent border-l-transparent';

    if (variant === 'inline') {
      // SVG spinner for inline use
      return (
        <svg
          className={`animate-spin ${config.spinner
            .replace('border-2', 'w-4 h-4')
            .replace('border-3', 'w-6 h-6')} ${className}`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    }

    // Circular spinner
    return (
      <div
        className={`animate-spin rounded-full ${colorClass} ${config.spinner} ${className}`}
      />
    );
  };

  // Fullscreen variant
  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          {renderSpinner()}
          {message && (
            <p className="text-gray-600 dark:text-gray-400 mt-4">{message}</p>
          )}
        </div>
      </div>
    );
  }

  // Inline variant (just the spinner, no wrapper)
  if (variant === 'inline') {
    return renderSpinner();
  }

  // Default spinner variant
  return (
    <div className="flex justify-center items-center p-4">
      {renderSpinner()}
    </div>
  );
};

export default Loader;
