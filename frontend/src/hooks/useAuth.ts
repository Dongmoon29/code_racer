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
        console.log('Checking auth token:', token ? 'exists' : 'missing');

        if (!token) {
          console.log('No auth token found, redirecting to login');
          setIsLoading(false);
          return;
        }

        console.log('Making API call to get current user...');
        const response = await authApi.getCurrentUser();
        console.log('API response:', response);

        if (response.user) {
          console.log('User found, logging in:', response.user);
          login(response.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // 인증 실패 시 토큰 제거
        localStorage.removeItem('authToken');
        console.log('Removed invalid auth token');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isLoggedIn && isLoading) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [isLoggedIn, isLoading, login]);

  return { user, isLoggedIn, isLoading };
};
