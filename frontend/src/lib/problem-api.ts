import {
  CreateProblemRequest,
  UpdateProblemRequest,
  ProblemDetail,
  ProblemSummary,
} from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// API request helper function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('authToken'); // Changed from accessToken to authToken

  console.log('Problem API Request:', {
    endpoint: `${API_BASE_URL}${endpoint}`,
    token: token ? 'exists' : 'missing',
    tokenLength: token?.length || 0,
  });

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Problem API Error:', {
      status: response.status,
      statusText: response.statusText,
      endpoint: `${API_BASE_URL}${endpoint}`,
      errorData,
    });
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

// Create problem (Admin only)
export async function createProblem(
  data: CreateProblemRequest
): Promise<ProblemDetail> {
  return apiRequest<ProblemDetail>('/problems', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Update problem (Admin only)
export async function updateProblem(
  id: string,
  data: UpdateProblemRequest
): Promise<ProblemDetail> {
  return apiRequest<ProblemDetail>(`/problems/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Delete problem (Admin only)
export async function deleteProblem(id: string): Promise<void> {
  return apiRequest<void>(`/problems/${id}`, {
    method: 'DELETE',
  });
}

// Get all problems
export async function getAllProblems(): Promise<{
  success: boolean;
  data: ProblemSummary[];
}> {
  return apiRequest<{ success: boolean; data: ProblemSummary[] }>('/problems');
}

// Get specific problem
export async function getProblem(id: string): Promise<ProblemDetail> {
  const response = await apiRequest<{ success: boolean; data: ProblemDetail }>(
    `/problems/${id}`
  );
  return response.data;
}

// Get problems by difficulty
export async function getProblemsByDifficulty(
  difficulty: string
): Promise<ProblemSummary[]> {
  return apiRequest<ProblemSummary[]>(
    `/problems/difficulty?difficulty=${difficulty}`
  );
}

// Search problems
export async function searchProblems(query: string): Promise<ProblemSummary[]> {
  return apiRequest<ProblemSummary[]>(
    `/problems/search?q=${encodeURIComponent(query)}`
  );
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
  return apiRequest<{
    problems: ProblemSummary[];
    total: number;
    page: number;
    limit: number;
  }>(`/problems/page?page=${page}&limit=${limit}`);
}
