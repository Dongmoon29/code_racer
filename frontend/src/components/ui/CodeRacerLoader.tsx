import React from 'react';
import Image from 'next/image';

interface CodeRacerLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CodeRacerLoader: React.FC<CodeRacerLoaderProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const imageSizes = {
    sm: 64,
    md: 96,
    lg: 128,
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* CodeRacer Character Animation */}
      <div className={`relative ${sizeClasses[size]} mb-6`}>
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
              width={imageSizes[size]}
              height={imageSizes[size]}
              className="drop-shadow-lg"
              style={{
                animation: 'raceMove 2s infinite ease-in-out',
              }}
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
};

export default CodeRacerLoader;
