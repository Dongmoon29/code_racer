import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/lib/api';

export const useAuth = () => {
  const { user, isLoggedIn, login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if token exists
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
        console.error('Auth check failed:', error);
        // Remove token on authentication failure
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
  }, [isLoggedIn, isLoading, login]);

  return { user, isLoggedIn, isLoading };
};
