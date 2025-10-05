import { create } from 'zustand';
import api, { authApi, extractUserFromResponse } from '@/lib/api';
import { AxiosError } from 'axios';
import { createErrorHandler } from '@/lib/error-tracking';

export type User = {
  id: string;
  name: string;
  email: string;
  profile_image?: string;
  homepage?: string;
  linkedin?: string;
  oauthProvider?: string;
  role: string;
  fav_language?: string;
  github?: string;
  company?: string;
  job_title?: string;
  rating?: number;
  created_at?: string;
};

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  isLoading: false, // Changed initial value to false
  login: (user: User) => {
    set({ user, isLoggedIn: true });
  },
  logout: async () => {
    try {
      // Skip API call if already logged out
      if (!get().isLoggedIn) {
        return;
      }

      await api.post('/auth/logout');
    } catch (error) {
      const errorHandler = createErrorHandler('authStore', 'logout');
      errorHandler(error, { userId: get().user?.id });
    } finally {
      // Clear token from sessionStorage (more secure than localStorage)
      sessionStorage.removeItem('authToken');

      set({
        user: null,
        isLoggedIn: false,
        isLoading: false,
      });
      window.location.href = '/login';
    }
  },
  initializeAuth: async () => {
    // Skip if already loading
    if (get().isLoading) {
      return;
    }

    try {
      set({ isLoading: true });

      // Check if token exists in sessionStorage
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        set({ user: null, isLoggedIn: false, isLoading: false });
        return;
      }

      const response = await authApi.getCurrentUser();
      const user = extractUserFromResponse(response);
      if (user) {
        set({ user, isLoggedIn: true });
      } else {
        set({ user: null, isLoggedIn: false });
      }
    } catch (error) {
      const errorHandler = createErrorHandler('authStore', 'initializeAuth');
      if (error instanceof AxiosError && error.response?.status === 401) {
        // User is not authenticated - clear token
        sessionStorage.removeItem('authToken');
        set({ user: null, isLoggedIn: false });
      } else {
        errorHandler(error, {
          hasToken: !!sessionStorage.getItem('authToken'),
          userId: get().user?.id,
        });
        set({ user: null, isLoggedIn: false });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
