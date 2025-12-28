// React Query hooks for Problem operations
import { useQueryClient } from '@tanstack/react-query';
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
import { useApiQuery, useApiMutation } from './useApiQuery';

// Mutation variables types
type UpdateProblemVariables = {
  id: string;
  data: UpdateProblemRequest;
};

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
  return useApiQuery<ProblemSummary[]>({
    queryKey: PROBLEM_QUERY_KEYS.lists(),
    queryFn: async () => {
      const response = await getAllProblems();
      return response.data as ProblemSummary[];
    },
    errorContext: { component: 'useProblems', action: 'getAllProblems' },
  });
};

// Get single problem
export const useProblem = (id: string) => {
  return useApiQuery<ProblemDetail>({
    queryKey: PROBLEM_QUERY_KEYS.detail(id),
    queryFn: () => getProblem(id),
    enabled: !!id,
    errorContext: { component: 'useProblem', action: 'getProblemById', problemId: id },
  });
};

// Create problem mutation
export const useCreateProblem = () => {
  return useApiMutation<ProblemDetail, CreateProblemRequest>({
    mutationFn: (data) => createProblem(data),
    invalidateKeys: [PROBLEM_QUERY_KEYS.lists() as readonly unknown[]],
    errorContext: { component: 'useCreateProblem', action: 'createProblem' },
  });
};

// Update problem mutation
export const useUpdateProblem = () => {
  return useApiMutation<ProblemDetail, UpdateProblemVariables>({
    mutationFn: ({ id, data }) => updateProblem(id, data),
    updateKeys: [
      {
        key: (variables: UpdateProblemVariables) => PROBLEM_QUERY_KEYS.detail(variables.id),
        updater: (_oldData: unknown, newData: ProblemDetail) => newData,
      },
    ],
    invalidateKeys: [PROBLEM_QUERY_KEYS.lists() as readonly unknown[]],
    errorContext: { component: 'useUpdateProblem', action: 'updateProblem' },
  });
};

// Delete problem mutation
export const useDeleteProblem = () => {
  const queryClient = useQueryClient();

  return useApiMutation<string, string>({
    mutationFn: async (id) => {
      await deleteProblem(id);
      return id;
    },
    invalidateKeys: [PROBLEM_QUERY_KEYS.lists() as readonly unknown[]],
    errorContext: { component: 'useDeleteProblem', action: 'deleteProblem' },
    onSuccess: (deletedId: string) => {
      // Remove the problem from cache
      queryClient.removeQueries({
        queryKey: PROBLEM_QUERY_KEYS.detail(deletedId) as readonly unknown[] as unknown[],
      });
    },
  });
};
