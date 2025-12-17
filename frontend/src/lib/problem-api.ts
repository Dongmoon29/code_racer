import {
  CreateProblemRequest,
  UpdateProblemRequest,
  ProblemDetail,
  ProblemSummary,
} from '@/types';
import api from '@/lib/api';
import { createErrorHandler } from '@/lib/error-tracking';

const errorHandler = createErrorHandler('problemApi', 'apiRequest');

// Create problem (Admin only)
export async function createProblem(
  data: CreateProblemRequest
): Promise<ProblemDetail> {
  try {
    const response = await api.post<{ success: boolean; data: ProblemDetail }>(
      '/problems',
      data
    );
    return response.data.data!;
  } catch (error) {
    errorHandler(error, { action: 'createProblem', data });
    throw error;
  }
}

// Update problem (Admin only)
export async function updateProblem(
  id: string,
  data: UpdateProblemRequest
): Promise<ProblemDetail> {
  try {
    const response = await api.put<{ success: boolean; data: ProblemDetail }>(
      `/problems/${id}`,
      data
    );
    return response.data.data!;
  } catch (error) {
    errorHandler(error, { action: 'updateProblem', id, data });
    throw error;
  }
}

// Delete problem (Admin only)
export async function deleteProblem(id: string): Promise<void> {
  try {
    await api.delete(`/problems/${id}`);
  } catch (error) {
    errorHandler(error, { action: 'deleteProblem', id });
    throw error;
  }
}

// Get all problems
export async function getAllProblems(): Promise<{
  success: boolean;
  data: ProblemSummary[];
}> {
  try {
    const response = await api.get<{
      success: boolean;
      data: ProblemSummary[];
    }>('/problems');
    return response.data;
  } catch (error) {
    errorHandler(error, { action: 'getAllProblems' });
    throw error;
  }
}

// Get specific problem
export async function getProblem(id: string): Promise<ProblemDetail> {
  try {
    const response = await api.get<{ success: boolean; data: ProblemDetail }>(
      `/problems/${id}`
    );
    return response.data.data!;
  } catch (error) {
    errorHandler(error, { action: 'getProblem', id });
    throw error;
  }
}

// Get problems by difficulty
export async function getProblemsByDifficulty(
  difficulty: string
): Promise<ProblemSummary[]> {
  try {
    const response = await api.get<ProblemSummary[]>('/problems/difficulty', {
      params: { difficulty },
    });
    return response.data;
  } catch (error) {
    errorHandler(error, { action: 'getProblemsByDifficulty', difficulty });
    throw error;
  }
}

// Search problems
export async function searchProblems(query: string): Promise<ProblemSummary[]> {
  try {
    const response = await api.get<ProblemSummary[]>('/problems/search', {
      params: { q: query },
    });
    return response.data;
  } catch (error) {
    errorHandler(error, { action: 'searchProblems', query });
    throw error;
  }
}

// Get problems with pagination
export async function getProblemsWithPagination(
  page: number = 1,
  limit: number = 10
): Promise<{
  problems: ProblemSummary[];
  total: number;
  page: number;
  limit: number;
}> {
  try {
    const response = await api.get<{
      problems: ProblemSummary[];
      total: number;
      page: number;
      limit: number;
    }>('/problems/page', {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    errorHandler(error, { action: 'getProblemsWithPagination', page, limit });
    throw error;
  }
}
