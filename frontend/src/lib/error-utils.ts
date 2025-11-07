import axios, { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types';

/**
 * Extract error message from various error types
 * @param error The error object (can be any type)
 * @param defaultMessage Default message if extraction fails
 * @returns Extracted or default error message
 */
export const extractErrorMessage = (
  error: unknown,
  defaultMessage = 'An unexpected error occurred'
): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    return axiosError.response?.data?.message || defaultMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return defaultMessage;
};

/**
 * Handle API error and extract message
 * @param error The error object
 * @param context Optional context for logging
 * @returns Error message string
 */
export const handleApiError = (
  error: unknown,
  context?: string
): string => {
  const message = extractErrorMessage(error);

  if (context) {
    console.error(`${context}:`, error);
  } else {
    console.error('API Error:', error);
  }

  return message;
};

/**
 * Safe async operation wrapper with error handling
 * @param operation The async operation to execute
 * @param errorHandler Error handling callback
 * @param finallyHandler Finally callback (cleanup)
 */
export const safeAsync = async <T>(
  operation: () => Promise<T>,
  errorHandler?: (error: unknown) => void,
  finallyHandler?: () => void
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      console.error('Async operation failed:', error);
    }
    return null;
  } finally {
    if (finallyHandler) {
      finallyHandler();
    }
  }
};
