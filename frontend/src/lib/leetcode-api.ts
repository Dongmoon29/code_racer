import {
  CreateLeetCodeRequest,
  UpdateLeetCodeRequest,
  LeetCodeDetail,
  LeetCodeSummary,
} from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// API request helper function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('authToken'); // Changed from accessToken to authToken

  console.log('LeetCode API Request:', {
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
    console.error('LeetCode API Error:', {
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

// Create LeetCode problem (Admin only)
export async function createLeetCodeProblem(
  data: CreateLeetCodeRequest
): Promise<LeetCodeDetail> {
  return apiRequest<LeetCodeDetail>('/leetcode', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Update LeetCode problem (Admin only)
export async function updateLeetCodeProblem(
  id: string,
  data: UpdateLeetCodeRequest
): Promise<LeetCodeDetail> {
  return apiRequest<LeetCodeDetail>(`/leetcode/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Delete LeetCode problem (Admin only)
export async function deleteLeetCodeProblem(id: string): Promise<void> {
  return apiRequest<void>(`/leetcode/${id}`, {
    method: 'DELETE',
  });
}

// Get all LeetCode problems
export async function getAllLeetCodeProblems(): Promise<{
  success: boolean;
  data: LeetCodeSummary[];
}> {
  return apiRequest<{ success: boolean; data: LeetCodeSummary[] }>('/leetcode');
}

// Get specific LeetCode problem
export async function getLeetCodeProblem(id: string): Promise<LeetCodeDetail> {
  const response = await apiRequest<{ success: boolean; data: LeetCodeDetail }>(
    `/leetcode/${id}`
  );
  return response.data;
}

// Get LeetCode problems by difficulty
export async function getLeetCodeProblemsByDifficulty(
  difficulty: string
): Promise<LeetCodeSummary[]> {
  return apiRequest<LeetCodeSummary[]>(
    `/leetcode/difficulty?difficulty=${difficulty}`
  );
}

// Search LeetCode problems
export async function searchLeetCodeProblems(
  query: string
): Promise<LeetCodeSummary[]> {
  return apiRequest<LeetCodeSummary[]>(
    `/leetcode/search?q=${encodeURIComponent(query)}`
  );
}

// Get LeetCode problems with pagination
export async function getLeetCodeProblemsWithPagination(
  page: number = 1,
  limit: number = 10
): Promise<{
  problems: LeetCodeSummary[];
  total: number;
  page: number;
  limit: number;
}> {
  return apiRequest<{
    problems: LeetCodeSummary[];
    total: number;
    page: number;
    limit: number;
  }>(`/leetcode/page?page=${page}&limit=${limit}`);
}
