import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useErrorHandler } from "./useErrorHandler";

interface ApiQueryOptions<TData> {
  queryKey: readonly unknown[];
  queryFn: () => Promise<TData>;
  errorContext?: { component: string; action: string; [key: string]: unknown };
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  retry?:
    number | boolean | ((failureCount: number, error: unknown) => boolean);
}

interface ApiMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  invalidateKeys?: (readonly unknown[])[];
  updateKeys?: Array<{
    key: readonly unknown[] | ((variables: TVariables) => readonly unknown[]);
    updater: (oldData: unknown, newData: TData) => unknown;
  }>;
  errorContext?: { component: string; action: string; [key: string]: unknown };
  onSuccess?: (data: TData, variables: TVariables) => void;
}

/**
 * Generic wrapper for useQuery with standardized error handling
 * Eliminates the need for try-catch blocks in every query
 */
export function useApiQuery<TData>(options: ApiQueryOptions<TData>) {
  const { queryKey, queryFn, errorContext, ...queryOptions } = options;
  const errorHandler = useErrorHandler(
    errorContext?.component || "useApiQuery",
    errorContext?.action || "fetch",
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
  });
}

/**
 * Generic wrapper for useMutation with automatic query invalidation
 * Eliminates duplicate invalidation logic
 */
export function useApiMutation<TData, TVariables>(
  options: ApiMutationOptions<TData, TVariables>,
) {
  const {
    mutationFn,
    invalidateKeys,
    updateKeys,
    errorContext,
    onSuccess,
    ...mutationOptions
  } = options;
  const queryClient = useQueryClient();
  const errorHandler = useErrorHandler(
    errorContext?.component || "useApiMutation",
    errorContext?.action || "mutate",
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
    onSuccess: (data: TData, variables: TVariables) => {
      // Update specific query keys with new data
      if (updateKeys) {
        updateKeys.forEach(({ key, updater }) => {
          const queryKey = typeof key === "function" ? key(variables) : key;
          queryClient.setQueryData(queryKey, (oldData: unknown) =>
            updater(oldData, data),
          );
        });
      }

      // Invalidate related query keys to refetch
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => {
          void queryClient.invalidateQueries({ queryKey: key });
        });
      }

      // Call custom onSuccess if provided
      if (onSuccess) {
        onSuccess(data, variables);
      }
    },
    ...mutationOptions,
  });
}
