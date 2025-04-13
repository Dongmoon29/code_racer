import { create } from 'zustand';
import api from '@/lib/api';

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
  login: (user: User) => void; // Promise 제거
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  login: (user: User) => {
    set({ user, isLoggedIn: true });
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
      set({ user: null, isLoggedIn: false });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  },
}));
