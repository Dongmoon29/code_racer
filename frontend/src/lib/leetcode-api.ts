import {
  CreateLeetCodeRequest,
  UpdateLeetCodeRequest,
  LeetCodeDetail,
  LeetCodeSummary,
} from './leetcode-types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// API 요청 헬퍼 함수
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('authToken'); // accessToken → authToken으로 수정

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

// LeetCode 문제 생성 (Admin only)
export async function createLeetCodeProblem(
  data: CreateLeetCodeRequest
): Promise<LeetCodeDetail> {
  return apiRequest<LeetCodeDetail>('/leetcode', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// LeetCode 문제 수정 (Admin only)
export async function updateLeetCodeProblem(
  id: string,
  data: UpdateLeetCodeRequest
): Promise<LeetCodeDetail> {
  return apiRequest<LeetCodeDetail>(`/leetcode/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// LeetCode 문제 삭제 (Admin only)
export async function deleteLeetCodeProblem(id: string): Promise<void> {
  return apiRequest<void>(`/leetcode/${id}`, {
    method: 'DELETE',
  });
}

// 모든 LeetCode 문제 조회
export async function getAllLeetCodeProblems(): Promise<{
  success: boolean;
  data: LeetCodeSummary[];
}> {
  return apiRequest<{ success: boolean; data: LeetCodeSummary[] }>('/leetcode');
}

// 특정 LeetCode 문제 조회
export async function getLeetCodeProblem(id: string): Promise<LeetCodeDetail> {
  const response = await apiRequest<{ success: boolean; data: LeetCodeDetail }>(
    `/leetcode/${id}`
  );
  return response.data;
}

// 난이도별 LeetCode 문제 조회
export async function getLeetCodeProblemsByDifficulty(
  difficulty: string
): Promise<LeetCodeSummary[]> {
  return apiRequest<LeetCodeSummary[]>(
    `/leetcode/difficulty?difficulty=${difficulty}`
  );
}

// LeetCode 문제 검색
export async function searchLeetCodeProblems(
  query: string
): Promise<LeetCodeSummary[]> {
  return apiRequest<LeetCodeSummary[]>(
    `/leetcode/search?q=${encodeURIComponent(query)}`
  );
}

// 페이지네이션으로 LeetCode 문제 조회
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
