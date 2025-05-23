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
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키 포함하여 요청
});

// 응답 인터셉터
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 로그인 시도 중인 경우는 리다이렉트하지 않음
      if (!error.config.url?.includes('/auth/login')) {
        await useAuthStore.getState().logout();
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
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // 현재 사용자 정보 조회
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 로그아웃
  logout: async () => {
    await api.post('/auth/logout');
  },

  // Google 로그인
  loginWithGoogle: () => {
    const backendURL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    window.location.href = `${backendURL}/auth/google/login`;
  },

  // GitHub 로그인 추가
  loginWithGitHub: () => {
    const backendURL =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    window.location.href = `${backendURL}/auth/github/login`;
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
