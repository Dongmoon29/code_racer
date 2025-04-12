import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';

// LeetCode 문제 상세 정보 인터페이스
export interface LeetCodeDetail {
  id: string;
  title: string;
  description: string;
  examples: string;
  constraints: string;
  difficulty: string;
  test_cases: string[];
  expected_outputs: string[];
  input_format: string;
  output_format: string;
  function_name: string;
  javascript_template: string;
  python_template: string;
  go_template: string;
  java_template: string;
  cpp_template: string;
}

export interface UserProfile {
  homepage?: string;
  linkedin?: string;
  github?: string;
  company?: string;
  job_title?: string;
  fav_language?: string;
}

// API 클라이언트 기본 설정
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터 - 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 에러 (인증 실패) 처리
    if (error.response && error.response.status === 401) {
      // 현재 경로가 로그인 페이지가 아닐 때만 리다이렉트
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login')
      ) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 인증 관련 API
export const authApi = {
  // 회원가입
  register: async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  },

  // 로그인
  login: async (email: string, password: string) => {
    console.log('로그인 호출');
    const response = await api.post('/auth/login', { email, password });
    // Zustand 스토어에 사용자 정보 저장
    useAuthStore
      .getState()
      .login(response.data.user, response.data.access_token);
    console.log('로그인 후 스토어 상태:', useAuthStore.getState());
    return response.data;
  },

  // 현재 사용자 정보 조회
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // 로그아웃
  logout: () => {
    useAuthStore.getState().logout();
  },

  // Google 로그인
  loginWithGoogle: async (code: string) => {
    const response = await api.post('/auth/google', { code });
    useAuthStore
      .getState()
      .login(response.data.user, response.data.access_token);
    return response.data;
  },
};

// 게임 관련 API
export const gameApi = {
  // 게임 방 목록 조회
  listGames: async () => {
    const response = await api.get('/games');
    return response.data;
  },

  // 게임 방 생성
  createGame: async (leetcodeId: string) => {
    const response = await api.post('/games', { leetcode_id: leetcodeId });
    return response.data;
  },

  // 게임 방 정보 조회
  getGame: async (gameId: string) => {
    const response = await api.get(`/games/${gameId}`);
    return response.data;
  },

  // 게임 방 참가
  joinGame: async (gameId: string) => {
    const response = await api.post(`/games/${gameId}/join`);
    return response.data;
  },

  // 코드 제출
  submitSolution: async (gameId: string, code: string, language: string) => {
    const response = await api.post(`/games/${gameId}/submit`, {
      code,
      language,
    });
    return response.data;
  },

  // 게임 방 닫기
  closeGame: async (gameId: string) => {
    const response = await api.post(`/games/${gameId}/close`);
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

  console.log('Getting template for language:', language);
  console.log('Available templates:', {
    javascript: problem.javascript_template,
    python: problem.python_template,
    go: problem.go_template,
    java: problem.java_template,
    cpp: problem.cpp_template,
  });

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
  // 프로필 업데이트
  updateProfile: async (profile: UserProfile) => {
    const response = await api.put('/users/profile', profile);
    return response.data;
  },

  // 프로필 조회
  getProfile: async (userId: string) => {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  },
};

export default api;
