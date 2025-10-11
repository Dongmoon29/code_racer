// React Query hooks for LeetCode operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createLeetCodeProblem,
  updateLeetCodeProblem,
  deleteLeetCodeProblem,
  getAllLeetCodeProblems,
  getLeetCodeProblem,
} from '@/lib/leetcode-api';
import {
  CreateLeetCodeRequest,
  UpdateLeetCodeRequest,
  LeetCodeDetail,
  LeetCodeSummary,
} from '@/types';

// Mutation variables types
type UpdateLeetCodeVariables = {
  id: string;
  data: UpdateLeetCodeRequest;
};
import { createErrorHandler } from '@/lib/error-tracking';

// Query keys
export const LEETCODE_QUERY_KEYS = {
  all: ['leetcode'] as const,
  lists: () => [...LEETCODE_QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...LEETCODE_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...LEETCODE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...LEETCODE_QUERY_KEYS.details(), id] as const,
};

// Get all LeetCode problems
export const useLeetCodeProblems = () => {
  const errorHandler = createErrorHandler(
    'useLeetCodeProblems',
    'getAllProblems'
  );

  return useQuery({
    queryKey: LEETCODE_QUERY_KEYS.lists(),
    queryFn: async () => {
      try {
        const response = await getAllLeetCodeProblems();
        return response.data as LeetCodeSummary[];
      } catch (error) {
        errorHandler(error, { action: 'getAllProblems' });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get single LeetCode problem
export const useLeetCodeProblem = (id: string) => {
  const errorHandler = createErrorHandler(
    'useLeetCodeProblem',
    'getProblemById'
  );

  return useQuery({
    queryKey: LEETCODE_QUERY_KEYS.detail(id),
    queryFn: async () => {
      try {
        return await getLeetCodeProblem(id);
      } catch (error) {
        errorHandler(error, {
          action: 'getProblemById',
          problemId: id,
        });
        throw error;
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Create LeetCode problem mutation
export const useCreateLeetCodeProblem = () => {
  const queryClient = useQueryClient();
  const errorHandler = createErrorHandler(
    'useCreateLeetCodeProblem',
    'createProblem'
  );

  return useMutation({
    mutationFn: async (data: CreateLeetCodeRequest) => {
      try {
        return await createLeetCodeProblem(data);
      } catch (error) {
        errorHandler(error, {
          action: 'createProblem',
          problemTitle: data.title,
        });
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch LeetCode problems list
      queryClient.invalidateQueries({ queryKey: LEETCODE_QUERY_KEYS.lists() });
    },
  });
};

// Update LeetCode problem mutation
export const useUpdateLeetCodeProblem = () => {
  const queryClient = useQueryClient();
  const errorHandler = createErrorHandler(
    'useUpdateLeetCodeProblem',
    'updateProblem'
  );

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateLeetCodeRequest;
    }) => {
      try {
        return await updateLeetCodeProblem(id, data);
      } catch (error) {
        errorHandler(error, {
          action: 'updateProblem',
          problemId: id,
          problemTitle: data.title,
        });
        throw error;
      }
    },
    onSuccess: (data: LeetCodeDetail, variables: UpdateLeetCodeVariables) => {
      // Update the specific problem in cache
      queryClient.setQueryData(LEETCODE_QUERY_KEYS.detail(variables.id), data);
      // Invalidate and refetch LeetCode problems list
      queryClient.invalidateQueries({ queryKey: LEETCODE_QUERY_KEYS.lists() });
    },
  });
};

// Delete LeetCode problem mutation
export const useDeleteLeetCodeProblem = () => {
  const queryClient = useQueryClient();
  const errorHandler = createErrorHandler(
    'useDeleteLeetCodeProblem',
    'deleteProblem'
  );

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await deleteLeetCodeProblem(id);
        return id;
      } catch (error) {
        errorHandler(error, {
          action: 'deleteProblem',
          problemId: id,
        });
        throw error;
      }
    },
    onSuccess: (deletedId: string) => {
      // Remove the problem from cache
      queryClient.removeQueries({
        queryKey: LEETCODE_QUERY_KEYS.detail(deletedId),
      });
      // Invalidate and refetch LeetCode problems list
      queryClient.invalidateQueries({ queryKey: LEETCODE_QUERY_KEYS.lists() });
    },
  });
};
