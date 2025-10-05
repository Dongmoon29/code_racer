import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import type { LeetCodeDetail, Game } from '@/types';
import { trackAPIError, createErrorHandler } from '@/lib/error-tracking';

// LeetCodeDetail type is imported from central types

export interface UserProfile {
  homepage?: string;
  linkedin?: string;
  github?: string;
  company?: string;
  job_title?: string;
  fav_language?: string;
}

// User type definition (matches authStore)
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profile_image?: string;
  homepage?: string;
  linkedin?: string;
  oauthProvider?: string;
}

// Type guard to check if object is User
const isUser = (obj: unknown): obj is User => {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof (obj as Record<string, unknown>).id === 'string' &&
    typeof (obj as Record<string, unknown>).name === 'string' &&
    typeof (obj as Record<string, unknown>).email === 'string' &&
    typeof (obj as Record<string, unknown>).role === 'string'
  );
};

// API client basic configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookie-based authentication for same-origin requests
});

// Request interceptor - Add Authorization header as fallback
api.interceptors.request.use(
  (config) => {
    // Try to get token from sessionStorage first (more secure than localStorage)
    const token = sessionStorage.getItem('authToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No auth token found for request to:', config.url);
    }

    // Log request for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.debug('API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Don't redirect during login attempts or auth initialization
      const url = error.config?.url || '';
      if (!url.includes('/auth/login') && !url.includes('/users/me')) {
        // Only logout if not already logged out to prevent infinite loops
        const authState = useAuthStore.getState();
        if (authState.isLoggedIn) {
          await authState.logout();
        }
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to consistently extract user information from API responses
export const extractUserFromResponse = (response: unknown): User | null => {
  // Login API: { success: true, data: { user, token } }
  if (
    response &&
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    response.data &&
    typeof response.data === 'object' &&
    response.data !== null &&
    'user' in response.data
  ) {
    const data = response.data as Record<string, unknown>;
    if (isUser(data.user)) {
      return data.user;
    }
  }
  // Register/GetCurrentUser API: { success: true, user: user }
  if (
    response &&
    typeof response === 'object' &&
    response !== null &&
    'user' in response
  ) {
    const responseObj = response as Record<string, unknown>;
    if (isUser(responseObj.user)) {
      return responseObj.user;
    }
  }
  return null;
};

// Authentication related API
export const authApi = {
  // User registration
  register: async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  },

  // User login
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Exchange OAuth code for token
  exchangeToken: async (code: string, state: string, provider: string) => {
    const response = await api.post('/auth/exchange-token', {
      code,
      state,
      provider,
    });
    return response.data;
  },

  // Get current user information
  getCurrentUser: async () => {
    const errorHandler = createErrorHandler('authApi', 'getCurrentUser');
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      errorHandler(error, { endpoint: '/users/me' });
      throw error;
    }
  },

  // User logout
  logout: async () => {
    await api.post('/auth/logout');
  },

  // Google login
  loginWithGoogle: () => {
    const backendURL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    window.location.href = `${backendURL}/auth/google`;
  },

  // GitHub login
  loginWithGitHub: () => {
    const backendURL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    window.location.href = `${backendURL}/auth/github`;
  },
};

// Game related API
export const matchApi = {
  // Get game information (used during game play)
  getGame: async (matchId: string): Promise<{ game: Game | null }> => {
    const response = await api.get(`/matches/${matchId}`);
    // Backend: { success: true, data: MatchResponse }
    const payload = response.data?.data;
    if (!payload) {
      return { game: null };
    }
    const mapped: Game = {
      id: payload.id,
      // Preferred fields
      playerA: payload.player_a
        ? {
            id: payload.player_a.id,
            email: payload.player_a.email,
            name: payload.player_a.name,
            created_at: payload.player_a.created_at,
          }
        : undefined,
      playerB: payload.player_b
        ? {
            id: payload.player_b.id,
            email: payload.player_b.email,
            name: payload.player_b.name,
            created_at: payload.player_b.created_at,
          }
        : undefined,

      winner: payload.winner
        ? {
            id: payload.winner.id,
            email: payload.winner.email,
            name: payload.winner.name,
            created_at: payload.winner.created_at,
          }
        : undefined,
      leetcode: payload.leetcode,
      status: payload.status,
      started_at: payload.started_at,
      created_at: payload.created_at,
      player_count: payload.player_b ? 2 : 1,
      is_full: !!payload.player_b,
    };
    return { game: mapped };
  },

  // 코드 제출
  submitSolution: async (matchId: string, code: string, language: string) => {
    const response = await api.post(`/matches/${matchId}/submit`, {
      code,
      language,
    });
    return response.data;
  },
};

// LeetCode 문제 관련 API
export const leetcodeApi = {
  // LeetCode 문제 목록 조회
  listLeetCodes: async () => {
    const response = await api.get('/leetcode');
    return response.data;
  },
};

export const getCodeTemplate = (
  problem: LeetCodeDetail,
  language: string
): string => {
  if (!problem) {
    console.error('Problem is undefined');
    return '';
  }

  switch (language) {
    case 'javascript':
      return problem.javascript_template || '';
    case 'python':
      return problem.python_template || '';
    case 'go':
      return problem.go_template || '';
    case 'java':
      return problem.java_template || '';
    case 'cpp':
      return problem.cpp_template || '';
    default:
      return '';
  }
};

export const userApi = {
  // 관리자용 사용자 목록 조회 (offset pagination)
  adminList: async (page: number, limit = 20, sort?: string) => {
    const response = await api.get(`/admin/users`, {
      params: { page, limit, ...(sort ? { sort } : {}) },
    });
    return response.data as {
      success: boolean;
      items: Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        created_at: string;
      }>;
      page: number;
      limit: number;
      total: number;
      has_next: boolean;
    };
  },
  // 프로필 업데이트
  updateProfile: async (profile: UserProfile) => {
    const response = await api.put('/users/profile', profile);
    return response.data;
  },

  // 리더보드 조회
  getLeaderboard: async () => {
    const response = await api.get('/users/leaderboard');
    return response.data as {
      success: boolean;
      users: Array<{
        id: string;
        name: string;
        rating: number;
      }>;
    };
  },
};

export default api;
