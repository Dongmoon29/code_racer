import { create } from 'zustand';
import api, { authApi, extractUserFromResponse } from '@/lib/api';
import { AxiosError } from 'axios';

export type User = {
  id: string;
  name: string;
  email: string;
  profile_image?: string;
  homepage?: string;
  linkedin?: string;
  oauthProvider?: string;
  role: string;
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
      console.error('Logout failed', error);
    } finally {
      // Remove token from local storage
      localStorage.removeItem('authToken');

      set({
        user: null,
        isLoggedIn: false,
        isLoading: false,
      });
      window.location.href = '/login';
    }
  },
  initializeAuth: async () => {
    // Check if token exists in local storage
    const token = localStorage.getItem('authToken');
    if (!token) {
      set({ user: null, isLoggedIn: false, isLoading: false });
      return;
    }

    // Skip if already loading
    if (get().isLoading) {
      return;
    }

    try {
      set({ isLoading: true });
      const response = await authApi.getCurrentUser();
      const user = extractUserFromResponse(response);
      if (user) {
        set({ user, isLoggedIn: true });
      } else {
        // Remove token if user info cannot be retrieved
        localStorage.removeItem('authToken');
        set({ user: null, isLoggedIn: false });
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        // Remove token if invalid
        localStorage.removeItem('authToken');
        set({ user: null, isLoggedIn: false });
      } else {
        console.error('Failed to initialize auth', error);
        set({ user: null, isLoggedIn: false });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
