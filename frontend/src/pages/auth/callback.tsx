import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';

const AuthCallback = () => {
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // 사용자 정보만 요청
        const response = await authApi.getCurrentUser();

        // 사용자 정보로 로그인 상태 설정
        useAuthStore.getState().login(response.user);

        // 대시보드로 리다이렉트
        router.replace('/dashboard');
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        router.replace('/login');
      }
    };

    // 페이지가 마운트되면 바로 사용자 정보 요청
    fetchUserData();
  }, [router]);

  return <div>Processing login...</div>;
};

export default AuthCallback;
