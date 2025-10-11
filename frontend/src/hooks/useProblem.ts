// React Query hooks for Problem operations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createProblem,
  updateProblem,
  deleteProblem,
  getAllProblems,
  getProblem,
} from '@/lib/problem-api';
import {
  CreateProblemRequest,
  UpdateProblemRequest,
  ProblemDetail,
  ProblemSummary,
} from '@/types';

// Mutation variables types
type UpdateProblemVariables = {
  id: string;
  data: UpdateProblemRequest;
};
import { createErrorHandler } from '@/lib/error-tracking';

// Query keys
export const PROBLEM_QUERY_KEYS = {
  all: ['problem'] as const,
  lists: () => [...PROBLEM_QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...PROBLEM_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...PROBLEM_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PROBLEM_QUERY_KEYS.details(), id] as const,
};

// Get all problems
export const useProblems = () => {
  const errorHandler = createErrorHandler('useProblems', 'getAllProblems');

  return useQuery({
    queryKey: PROBLEM_QUERY_KEYS.lists(),
    queryFn: async () => {
      try {
        const response = await getAllProblems();
        return response.data as ProblemSummary[];
      } catch (error) {
        errorHandler(error, { action: 'getAllProblems' });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get single problem
export const useProblem = (id: string) => {
  const errorHandler = createErrorHandler('useProblem', 'getProblemById');

  return useQuery({
    queryKey: PROBLEM_QUERY_KEYS.detail(id),
    queryFn: async () => {
      try {
        return await getProblem(id);
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

// Create problem mutation
export const useCreateProblem = () => {
  const queryClient = useQueryClient();
  const errorHandler = createErrorHandler('useCreateProblem', 'createProblem');

  return useMutation({
    mutationFn: async (data: CreateProblemRequest) => {
      try {
        return await createProblem(data);
      } catch (error) {
        errorHandler(error, {
          action: 'createProblem',
          problemTitle: data.title,
        });
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate and refetch problems list
      queryClient.invalidateQueries({ queryKey: PROBLEM_QUERY_KEYS.lists() });
    },
  });
};

// Update problem mutation
export const useUpdateProblem = () => {
  const queryClient = useQueryClient();
  const errorHandler = createErrorHandler('useUpdateProblem', 'updateProblem');

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProblemRequest;
    }) => {
      try {
        return await updateProblem(id, data);
      } catch (error) {
        errorHandler(error, {
          action: 'updateProblem',
          problemId: id,
          problemTitle: data.title,
        });
        throw error;
      }
    },
    onSuccess: (data: ProblemDetail, variables: UpdateProblemVariables) => {
      // Update the specific problem in cache
      queryClient.setQueryData(PROBLEM_QUERY_KEYS.detail(variables.id), data);
      // Invalidate and refetch problems list
      queryClient.invalidateQueries({ queryKey: PROBLEM_QUERY_KEYS.lists() });
    },
  });
};

// Delete problem mutation
export const useDeleteProblem = () => {
  const queryClient = useQueryClient();
  const errorHandler = createErrorHandler('useDeleteProblem', 'deleteProblem');

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await deleteProblem(id);
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
        queryKey: PROBLEM_QUERY_KEYS.detail(deletedId),
      });
      // Invalidate and refetch problems list
      queryClient.invalidateQueries({ queryKey: PROBLEM_QUERY_KEYS.lists() });
    },
  });
};
