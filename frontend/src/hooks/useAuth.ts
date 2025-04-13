import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';

export const useAuth = () => {
  const { user, isLoggedIn, login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authApi.getCurrentUser();
        if (response.user) {
          login(response.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isLoggedIn) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [isLoggedIn, login]);

  return { user, isLoggedIn, isLoading };
};
