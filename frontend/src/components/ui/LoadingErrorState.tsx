import React, { FC, ReactNode } from 'react';
import { Loader } from './Loader';

interface LoadingErrorStateProps {
  isLoading: boolean;
  error?: string | null | Error;
  isEmpty?: boolean;
  emptyMessage?: string;
  errorMessage?: string;
  children: ReactNode;
  loaderVariant?: 'spinner' | 'inline' | 'dots';
  loaderSize?: 'sm' | 'md' | 'lg';
}

/**
 * Reusable component for handling loading/error/empty states
 * Eliminates duplicate conditional rendering patterns across the app
 */
export const LoadingErrorState: FC<LoadingErrorStateProps> = ({
  isLoading,
  error,
  isEmpty = false,
  emptyMessage = 'No data available',
  errorMessage,
  children,
  loaderVariant = 'spinner',
  loaderSize = 'lg',
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <Loader variant={loaderVariant} size={loaderSize} />
      </div>
    );
  }

  if (error) {
    const displayError = errorMessage ||
      (typeof error === 'string' ? error : error?.message) ||
      'An error occurred';

    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="text-center">
          <div className="text-lg text-[var(--red-9)] mb-2">
            {displayError}
          </div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="text-center text-[var(--gray-11)]">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
