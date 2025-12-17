import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import type { ProblemDetail, Game, UserProfile } from '@/types';
import { createErrorHandler } from '@/lib/error-tracking';

// API client basic configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookie-based authentication for same-origin requests
});

// Request interceptor - Add Authorization header as fallback
// Note: Backend sets httpOnly cookie (auth_token) which is automatically sent with requests
// sessionStorage token is used as fallback for WebSocket connections and when cookies fail
api.interceptors.request.use(
  (config) => {
    // Get token from sessionStorage as fallback (primary auth is via httpOnly cookie)
    // This is needed for WebSocket connections which can't use cookies reliably
    const token = sessionStorage.getItem('authToken');

    if (token) {
      // Add Authorization header as fallback (cookie is primary, this is backup)
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request for debugging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.debug('API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    // Error interceptor - errors are handled by response interceptor
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
      const skipLogout =
        url.includes('/auth/login') ||
        url.includes('/users/me') ||
        url.includes('/auth/exchange-token');
      if (!skipLogout) {
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
            rating: payload.player_a.rating,
          }
        : undefined,
      playerB: payload.player_b
        ? {
            id: payload.player_b.id,
            email: payload.player_b.email,
            name: payload.player_b.name,
            created_at: payload.player_b.created_at,
            rating: payload.player_b.rating,
          }
        : undefined,

      winner: payload.winner
        ? {
            id: payload.winner.id,
            email: payload.winner.email,
            name: payload.winner.name,
            created_at: payload.winner.created_at,
            rating: payload.winner.rating,
          }
        : undefined,
      winner_execution_time_seconds:
        payload.winner_execution_time_seconds ?? undefined,
      winner_memory_usage_kb: payload.winner_memory_usage_kb ?? undefined,
      winner_rating_delta: payload.winner_rating_delta ?? undefined,
      loser_rating_delta: payload.loser_rating_delta ?? undefined,
      problem: payload.problem,
      status: payload.status,
      mode: payload.mode || 'casual_pvp', // Add mode field mapping
      started_at: payload.started_at,
      ended_at: payload.ended_at,
      created_at: payload.created_at,
      player_count: payload.player_b ? 2 : 1,
      is_full: !!payload.player_b,
    };
    return { game: mapped };
  },

  submitSolution: async (matchId: string, code: string, language: string) => {
    const response = await api.post(`/matches/${matchId}/submit`, {
      code,
      language,
    });
    return response.data;
  },
};

export const problemApi = {
  listProblems: async () => {
    const response = await api.get('/problems');
    return response.data;
  },
};

export const getCodeTemplate = (
  problem: ProblemDetail,
  language: string
): string => {
  if (!problem) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Problem is undefined');
    }
    return '';
  }

  if (!problem.io_templates || !Array.isArray(problem.io_templates)) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Problem io_templates is not available', problem);
    }
    return '';
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Available io_templates:', problem.io_templates);
    console.log('Looking for language:', language);
  }

  const template = problem.io_templates.find((t) => t.language === language);

  if (process.env.NODE_ENV === 'development') {
    console.log('Found template:', template);
  }

  return template ? template.code : '';
};

export const userApi = {
  adminList: async (
    page: number,
    limit = 20,
    sort?: string,
    search?: string
  ) => {
    const response = await api.get(`/admin/users`, {
      params: {
        page,
        limit,
        ...(sort ? { sort } : {}),
        ...(search ? { search } : {}),
      },
    });
    return response.data as {
      success: boolean;
      items: Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        oauth_provider?: string;
        created_at: string;
        updated_at?: string;
      }>;
      page: number;
      limit: number;
      total: number;
      has_next: boolean;
    };
  },
  updateProfile: async (profile: UserProfile) => {
    const response = await api.put('/users/profile', profile);
    return response.data;
  },

  getUserProfile: async (userId: string) => {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  },

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
