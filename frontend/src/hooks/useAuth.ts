import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';

export const useAuth = () => {
  const { user, isLoggedIn, login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 토큰이 있는지 확인
        const token = localStorage.getItem('authToken');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await authApi.getCurrentUser();
        if (response.user) {
          login(response.user);
        }
      } catch (error) {
        console.error('Auth check failed', error);
        // 인증 실패 시 토큰 제거
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isLoggedIn && isLoading) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  return { user, isLoggedIn, isLoading };
};
