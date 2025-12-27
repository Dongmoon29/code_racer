import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import type {
  ProblemDetail,
  Game,
  UserProfile,
  LoginResponse,
  RegisterResponse,
  ExchangeTokenResponse,
  GetCurrentUserResponse,
  GetMatchResponse,
  MatchResponse,
  SubmitSolutionResponse,
  GetProblemResponse,
  ListProblemsResponse,
  CreateProblemResponse,
  UpdateProblemResponse,
  DeleteProblemResponse,
  GetUserProfileResponse,
  UpdateUserProfileResponse,
} from '@/types';
import { createErrorHandler } from '@/lib/error-tracking';

// API client basic configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add Authorization header from sessionStorage
// Token-based authentication only (no cookies)
api.interceptors.request.use(
  (config) => {
    // Get token from sessionStorage for all requests
    const token = sessionStorage.getItem('authToken');

    if (token) {
      // Add Authorization header with Bearer token
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
  register: async (
    email: string,
    password: string,
    name: string
  ): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>('/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  },

  // User login
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  // Exchange OAuth code for token
  exchangeToken: async (
    code: string,
    state: string,
    provider: string
  ): Promise<ExchangeTokenResponse> => {
    const response = await api.post<ExchangeTokenResponse>(
      '/auth/exchange-token',
      {
        code,
        state,
        provider,
      }
    );
    return response.data;
  },

  // Get current user information
  getCurrentUser: async (): Promise<GetCurrentUserResponse> => {
    const errorHandler = createErrorHandler('authApi', 'getCurrentUser');
    try {
      const response = await api.get<GetCurrentUserResponse>('/users/me');
      return response.data;
    } catch (error) {
      errorHandler(error, { endpoint: '/users/me' });
      throw error;
    }
  },

  // User logout
  logout: async (): Promise<void> => {
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
    const response = await api.get<GetMatchResponse>(`/matches/${matchId}`);

    // Backend: { success: true, data: MatchResponse }
    if (!response.data.success) {
      return { game: null };
    }

    const payload: MatchResponse = response.data.data;
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

  submitSolution: async (
    matchId: string,
    code: string,
    language: string
  ): Promise<SubmitSolutionResponse> => {
    const response = await api.post<SubmitSolutionResponse>(
      `/matches/${matchId}/submit`,
      {
        code,
        language,
      }
    );
    return response.data;
  },
};

export const problemApi = {
  listProblems: async (): Promise<ListProblemsResponse> => {
    const response = await api.get<ListProblemsResponse>('/problems');
    return response.data;
  },

  getProblem: async (problemId: string): Promise<GetProblemResponse> => {
    const response = await api.get<GetProblemResponse>(`/problems/${problemId}`);
    return response.data;
  },

  createProblem: async (data: unknown): Promise<CreateProblemResponse> => {
    const response = await api.post<CreateProblemResponse>('/problems', data);
    return response.data;
  },

  updateProblem: async (
    problemId: string,
    data: unknown
  ): Promise<UpdateProblemResponse> => {
    const response = await api.put<UpdateProblemResponse>(
      `/problems/${problemId}`,
      data
    );
    return response.data;
  },

  deleteProblem: async (problemId: string): Promise<DeleteProblemResponse> => {
    const response = await api.delete<DeleteProblemResponse>(
      `/problems/${problemId}`
    );
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
  updateProfile: async (
    profile: UserProfile
  ): Promise<UpdateUserProfileResponse> => {
    const response = await api.put<UpdateUserProfileResponse>(
      '/users/profile',
      profile
    );
    return response.data;
  },

  getUserProfile: async (userId: string): Promise<GetUserProfileResponse> => {
    const response = await api.get<GetUserProfileResponse>(
      `/users/${userId}/profile`
    );
    return response.data;
  },

  getLeaderboard: async () => {
    const response = await api.get('/users/leaderboard');
    return response.data as {
      success: boolean;
      users: Array<{
        id: string;
        name: string;
        profile_image?: string;
        rating: number;
      }>;
    };
  },

  // Follow/Unfollow APIs
  follow: async (userId: string) => {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data as {
      success: boolean;
      message: string;
    };
  },

  unfollow: async (userId: string) => {
    const response = await api.delete(`/users/${userId}/follow`);
    return response.data as {
      success: boolean;
      message: string;
    };
  },

  getFollowStats: async (userId: string) => {
    const response = await api.get(`/users/${userId}/follow/stats`);
    return response.data as {
      success: boolean;
      stats: {
        user_id: string;
        followers: number;
        following: number;
        is_following: boolean;
      };
    };
  },

  getFollowers: async (userId: string, page = 1, limit = 20) => {
    const response = await api.get(`/users/${userId}/followers`, {
      params: { page, limit },
    });
    return response.data as {
      success: boolean;
      items: Array<{
        id: string;
        name: string;
        email: string;
        profile_image?: string;
      }>;
      total: number;
      page: number;
      limit: number;
    };
  },

  getFollowing: async (userId: string, page = 1, limit = 20) => {
    const response = await api.get(`/users/${userId}/following`, {
      params: { page, limit },
    });
    return response.data as {
      success: boolean;
      items: Array<{
        id: string;
        name: string;
        email: string;
        profile_image?: string;
      }>;
      total: number;
      page: number;
      limit: number;
    };
  },
};

export const communityApi = {
  create: async (
    type: 'bug' | 'feature' | 'improvement' | 'other',
    title: string,
    content: string
  ) => {
    const response = await api.post('/community', {
      type,
      title,
      content,
    });
    return response.data as {
      success: boolean;
      data: {
        id: string;
        user_id: string;
        type: string;
        title: string;
        content: string;
        status: string;
        created_at: string;
        updated_at: string;
      };
    };
  },

  listPosts: async (
    limit = 50,
    offset = 0,
    status?: string,
    type?: string,
    sort: 'hot' | 'new' | 'top' = 'hot'
  ) => {
    const params: Record<string, string | number> = { limit, offset, sort };
    if (status) params.status = status;
    if (type) params.type = type;

    const response = await api.get('/community', { params });
    return response.data as {
      success: boolean;
      data: {
        items: Array<{
          id: string;
          user_id: string;
          type: string;
          title: string;
          content: string;
          status: string;
          score: number;
          comment_count: number;
          my_vote: number;
          created_at: string;
          updated_at: string;
          user?: {
            id: string;
            name: string;
            email: string;
            profile_image?: string;
          };
        }>;
        total: number;
        limit: number;
        offset: number;
      };
    };
  },

  getMyPosts: async (limit = 20, offset = 0) => {
    const response = await api.get('/community/my', {
      params: { limit, offset },
    });
    return response.data as {
      success: boolean;
      data: {
        items: Array<{
          id: string;
          user_id: string;
          type: string;
          title: string;
          content: string;
          status: string;
          created_at: string;
          updated_at: string;
        }>;
        total: number;
        limit: number;
        offset: number;
      };
    };
  },

  getPost: async (id: string) => {
    const response = await api.get(`/community/${id}`);
    return response.data as {
      success: boolean;
      data: {
        id: string;
        user_id: string;
        type: string;
        title: string;
        content: string;
        status: string;
        score: number;
        comment_count: number;
        my_vote: number;
        created_at: string;
        updated_at: string;
        user?: {
          id: string;
          name: string;
          email: string;
          profile_image?: string;
        };
      };
    };
  },

  vote: async (id: string, value: -1 | 0 | 1) => {
    const response = await api.post(`/community/${id}/vote`, { value });
    return response.data as {
      success: boolean;
      data: {
        id: string;
        user_id: string;
        type: string;
        title: string;
        content: string;
        status: string;
        score: number;
        comment_count: number;
        my_vote: number;
        created_at: string;
        updated_at: string;
        user?: {
          id: string;
          name: string;
          email: string;
          profile_image?: string;
        };
      };
    };
  },
};

export const communityCommentApi = {
  create: async (postId: string, content: string, parentId?: string) => {
    const body: { content: string; parent_id?: string } = { content };
    if (parentId) {
      body.parent_id = parentId;
    }
    const response = await api.post(`/community/comments/${postId}`, body);
    return response.data as {
      success: boolean;
      data: {
        id: string;
        post_id: string;
        user_id: string;
        content: string;
        created_at: string;
        updated_at: string;
        user?: {
          id: string;
          name: string;
          email: string;
          profile_image?: string;
        };
      };
    };
  },

  getComments: async (
    postId: string,
    limit = 50,
    offset = 0,
    withReplies = false
  ) => {
    const params: Record<string, string | number> = { limit, offset };
    if (withReplies) {
      params.withReplies = 'true';
    }
    const response = await api.get(`/community/comments/${postId}`, {
      params,
    });
    return response.data as {
      success: boolean;
      data: {
        items: Array<{
          id: string;
          post_id: string;
          user_id: string;
          parent_id?: string;
          content: string;
          score?: number;
          my_vote?: number;
          created_at: string;
          updated_at: string;
          replies?: Array<{
            id: string;
            post_id: string;
            user_id: string;
            parent_id?: string;
            content: string;
            score?: number;
            my_vote?: number;
            created_at: string;
            updated_at: string;
            user?: {
              id: string;
              name: string;
              email: string;
              profile_image?: string;
            };
          }>;
          user?: {
            id: string;
            name: string;
            email: string;
            profile_image?: string;
          };
        }>;
        total?: number;
        limit?: number;
        offset?: number;
      };
    };
  },

  vote: async (commentId: string, value: -1 | 0 | 1) => {
    const response = await api.post(`/community/comments/vote/${commentId}`, {
      value,
    });
    return response.data as {
      success: boolean;
      data: {
        id: string;
        post_id: string;
        user_id: string;
        parent_id?: string;
        content: string;
        score: number;
        my_vote: number;
        created_at: string;
        updated_at: string;
        user?: {
          id: string;
          name: string;
          email: string;
          profile_image?: string;
        };
      };
    };
  },

  update: async (commentId: string, content: string) => {
    const response = await api.put(`/community/comments/${commentId}`, {
      content,
    });
    return response.data as {
      success: boolean;
      data: {
        id: string;
        post_id: string;
        user_id: string;
        content: string;
        created_at: string;
        updated_at: string;
        user?: {
          id: string;
          name: string;
          email: string;
          profile_image?: string;
        };
      };
    };
  },

  delete: async (commentId: string) => {
    const response = await api.delete(`/community/comments/${commentId}`);
    return response.data as {
      success: boolean;
      message: string;
    };
  },
};

export default api;
