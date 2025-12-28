import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useErrorHandler } from './useErrorHandler';

/**
 * Generic wrapper for useQuery with standardized error handling
 * Eliminates the need for try-catch blocks in every query
 */
export function useApiQuery<TData, TError = Error>(
  options: {
    queryKey: readonly unknown[];
    queryFn: () => Promise<TData>;
    errorContext?: { component: string; action: string; [key: string]: unknown };
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    retry?: number | boolean | ((failureCount: number, error: unknown) => boolean);
  }
) {
  const { queryKey, queryFn, errorContext, ...queryOptions } = options;
  const errorHandler = useErrorHandler(
    errorContext?.component || 'useApiQuery',
    errorContext?.action || 'fetch'
  );

  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error) {
        errorHandler(error, errorContext);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes default
    gcTime: 10 * 60 * 1000, // 10 minutes default (replaces cacheTime)
    ...queryOptions,
  }) as any;
}

/**
 * Generic wrapper for useMutation with automatic query invalidation
 * Eliminates duplicate invalidation logic
 */
export function useApiMutation<TData, TVariables, TError = Error>(
  options: {
    mutationFn: (variables: TVariables) => Promise<TData>;
    invalidateKeys?: (readonly unknown[])[];
    updateKeys?: Array<{ key: readonly unknown[] | ((variables: TVariables) => readonly unknown[]); updater: (oldData: unknown, newData: TData) => unknown }>;
    errorContext?: { component: string; action: string; [key: string]: unknown };
    onSuccess?: (data: TData, variables: TVariables, context: unknown) => void;
  }
) {
  const { mutationFn, invalidateKeys, updateKeys, errorContext, onSuccess, ...mutationOptions } = options;
  const queryClient = useQueryClient();
  const errorHandler = useErrorHandler(
    errorContext?.component || 'useApiMutation',
    errorContext?.action || 'mutate'
  );

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      try {
        return await mutationFn(variables);
      } catch (error) {
        errorHandler(error, errorContext);
        throw error;
      }
    },
    onSuccess: (data: TData, variables: TVariables, context: unknown) => {
      // Update specific query keys with new data
      if (updateKeys) {
        updateKeys.forEach(({ key, updater }) => {
          const queryKey = typeof key === 'function' ? key(variables) : key;
          queryClient.setQueryData(queryKey as unknown[], (oldData: unknown) => updater(oldData, data));
        });
      }

      // Invalidate related query keys to refetch
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key as unknown[] });
        });
      }

      // Call custom onSuccess if provided
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },
    ...mutationOptions,
  }) as any;
}
