import React, { FC } from 'react';

interface LoadingScreenProps {
  message?: string;
  spinnerColor?: string;
}

export const LoadingScreen: FC<LoadingScreenProps> = ({
  message = 'Loading...',
  spinnerColor = 'border-orange-500',
}) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div
          className={`animate-spin rounded-full h-12 w-12 border-b-2 ${spinnerColor} mx-auto mb-4`}
        ></div>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
};
