import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';

const AuthCallback = () => {
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async (token: string) => {
      try {
        // 1. 먼저 토큰 저장
        useAuthStore.getState().setToken(token);

        // 2. 저장된 토큰으로 사용자 정보 요청
        const response = await authApi.getCurrentUser();

        // 3. 사용자 정보와 토큰으로 로그인 상태 설정
        useAuthStore.getState().login(response.user, token);

        // 4. 대시보드로 리다이렉트
        router.push('/dashboard');
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        router.push('/login');
      }
    };

    const { token } = router.query;
    if (token && typeof token === 'string') {
      fetchUserData(token);
    }
  }, [router.query]);

  return <div>Processing login...</div>;
};

export default AuthCallback;
