import { create } from 'zustand';
import api, { authApi } from '@/lib/api';

// User 타입 정의
type User = {
  id: string;
  name: string;
  email: string;
  homepage?: string; // 선택적 필드
  linkedin?: string; // 선택적 필드
  oauthProvider?: string; // 선택적 필드
};

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  login: (user: User) => {
    set({ user, isLoggedIn: true });
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
      set({
        user: null,
        isLoggedIn: false,
      });
    } catch (error) {
      console.error('Logout failed:', error);
      set({
        user: null,
        isLoggedIn: false,
      });
    }
  },
  initializeAuth: async () => {
    try {
      set({ isLoading: true });
      const response = await authApi.getCurrentUser();
      if (response.user) {
        set({ user: response.user, isLoggedIn: true });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ user: null, isLoggedIn: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
