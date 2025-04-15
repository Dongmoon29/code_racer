import { create } from 'zustand';
import api, { authApi } from '@/lib/api';
import { AxiosError } from 'axios';

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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  isLoading: false, // 초기값을 false로 변경
  login: (user: User) => {
    set({ user, isLoggedIn: true });
  },
  logout: async () => {
    try {
      // 이미 로그아웃 상태면 API 호출 스킵
      if (!get().isLoggedIn) {
        return;
      }

      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      set({
        user: null,
        isLoggedIn: false,
        isLoading: false,
      });
      window.location.href = '/login';
    }
  },
  initializeAuth: async () => {
    // 이미 로딩 중이거나 로그아웃 상태면 스킵
    const state = get();
    if (state.isLoading || (!state.isLoggedIn && !state.user)) {
      return;
    }

    try {
      set({ isLoading: true });
      const response = await authApi.getCurrentUser();
      if (response.user) {
        set({ user: response.user, isLoggedIn: true });
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        // 로그아웃 한 번만 호출
        await get().logout();
      } else {
        console.error('Failed to initialize auth:', error);
        set({ user: null, isLoggedIn: false });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
