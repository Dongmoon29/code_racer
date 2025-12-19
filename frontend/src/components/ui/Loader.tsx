import React from 'react';
import Image from 'next/image';

export type LoaderVariant = 'spinner' | 'fullscreen' | 'branded' | 'inline';
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
      branded: 'w-16 h-16',
      image: 64,
    },
    md: {
      spinner: 'w-6 h-6 border-2',
      branded: 'w-24 h-24',
      image: 96,
    },
    lg: {
      spinner: 'w-8 h-8 border-3',
      branded: 'w-32 h-32',
      image: 128,
    },
  };

  const config = sizeConfig[size];

  // Spinner component (used in spinner, inline, and fullscreen variants)
  const renderSpinner = () => {
    const colorClass =
      spinnerColor ||
      (variant === 'fullscreen'
        ? 'border-orange-500'
        : 'border-t-blue-500 border-b-blue-500 border-r-transparent border-l-transparent');

    if (variant === 'inline') {
      // SVG spinner for inline use
      return (
        <svg
          className={`animate-spin ${config.spinner.replace('border-2', 'w-4 h-4').replace('border-3', 'w-6 h-6')} ${className}`}
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

  // Branded loader (CodeRacer character animation)
  const renderBranded = () => (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${config.branded} mb-6`}>
        {/* Racing Track Background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 h-8 bg-gray-300 rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.5s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Character Image with Animation */}
        <div className="relative z-10 flex items-center justify-center">
          <div
            className="relative animate-bounce"
            style={{ animationDuration: '1.2s' }}
          >
            <Image
              src="/code_racer_hero.webp"
              alt="CodeRacer Character"
              width={config.image}
              height={config.image}
              className="drop-shadow-lg"
              style={{
                animation: 'raceMove 2s infinite ease-in-out',
              }}
              priority
              sizes={`${config.image}px`}
              quality={90}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
            />
          </div>
        </div>

        {/* Racing Checkered Flag */}
        <div className="absolute top-2 right-2 text-2xl animate-pulse">🏁</div>

        {/* Floating Code Symbols */}
        <div className="absolute inset-0 pointer-events-none">
          {['</>', '{ }', '()', '[]'].map((symbol, i) => (
            <div
              key={i}
              className="absolute text-blue-500 font-mono text-xs animate-ping"
              style={{
                top: `${15 + i * 20}%`,
                left: `${10 + i * 15}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '2s',
              }}
            >
              {symbol}
            </div>
          ))}
        </div>

        {/* Racing Dust Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-ping"
              style={{
                top: `${30 + i * 8}%`,
                left: `${5 + i * 12}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.5s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Custom CSS for racing animation */}
      <style jsx>{`
        @keyframes raceMove {
          0% {
            transform: translateX(-5px) rotate(-2deg);
          }
          25% {
            transform: translateX(0px) rotate(0deg);
          }
          50% {
            transform: translateX(5px) rotate(2deg);
          }
          75% {
            transform: translateX(0px) rotate(0deg);
          }
          100% {
            transform: translateX(-5px) rotate(-2deg);
          }
        }
      `}</style>
    </div>
  );

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

  // Branded variant
  if (variant === 'branded') {
    return renderBranded();
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

