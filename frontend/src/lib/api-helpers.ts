/**
 * API helper utilities to reduce boilerplate in API client code
 */

/**
 * Generic API response type
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error_code?: string;
}

/**
 * Extract data from API response
 * Standardizes the pattern of `return response.data`
 */
export function extractData<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || 'API request failed');
  }

  if (response.data === undefined) {
    throw new Error('Response data is undefined');
  }

  return response.data;
}

/**
 * Create a data extractor for a specific response shape
 * Useful for consistent API client patterns
 */
export function createDataExtractor<TResponse, TData>(
  selector: (response: TResponse) => TData
) {
  return (response: TResponse): TData => {
    return selector(response);
  };
}

/**
 * Handle API response with success check
 */
export function handleApiResponse<T>(
  response: ApiResponse<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (message: string) => void;
  }
): T {
  if (!response.success) {
    const errorMessage = response.message || 'API request failed';
    options?.onError?.(errorMessage);
    throw new Error(errorMessage);
  }

  if (response.data === undefined) {
    throw new Error('Response data is undefined');
  }

  options?.onSuccess?.(response.data);
  return response.data;
}
