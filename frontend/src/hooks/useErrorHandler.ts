import { useCallback } from 'react';
import { createErrorHandler } from '@/lib/error-tracking';

/**
 * Unified error handler hook for consistent error handling across components
 * 
 * @param component - Component name for error tracking
 * @param action - Action name for error tracking
 * @returns Error handler function
 * 
 * @example
 * ```tsx
 * const handleError = useErrorHandler('MyComponent', 'fetchData');
 * 
 * try {
 *   await fetchData();
 * } catch (error) {
 *   handleError(error, { userId: user.id });
 * }
 * ```
 */
export const useErrorHandler = (
  component: string,
  action: string
) => {
  return useCallback(
    (error: unknown, context?: Record<string, unknown>) => {
      const handler = createErrorHandler(component, action);
      handler(error, context);
    },
    [component, action]
  );
};

