import { create } from 'zustand';
import api, { authApi, extractUserFromResponse } from '@/lib/api';
import { AxiosError } from 'axios';

// User 타입 정의
type User = {
  id: string;
  name: string;
  email: string;
  profile_image?: string; // 추가된 필드
  homepage?: string;
  linkedin?: string;
  oauthProvider?: string;
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
      console.error('Logout failed', error);
    } finally {
      // 로컬 스토리지에서 토큰 제거
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
    // 로컬 스토리지에 토큰이 있는지 확인
    const token = localStorage.getItem('authToken');
    if (!token) {
      set({ user: null, isLoggedIn: false, isLoading: false });
      return;
    }

    // 이미 로딩 중이면 스킵
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
        // 사용자 정보를 가져올 수 없으면 토큰 제거
        localStorage.removeItem('authToken');
        set({ user: null, isLoggedIn: false });
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        // 토큰이 유효하지 않으면 제거
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
