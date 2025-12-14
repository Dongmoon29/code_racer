import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/stores/authStore';

interface UseAuthGuardOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

/**
 * Custom hook for handling authentication and authorization guards
 * @param options Configuration options for the auth guard
 * @returns Object containing loading state and user info
 */
export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const {
    requireAuth = true,
    requireAdmin = false,
    redirectTo = '/login',
  } = options;

  const router = useRouter();
  const { user, isLoggedIn, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    // Check authentication requirement
    if (requireAuth && !isLoggedIn) {
      // Save the current page to redirect back after login
      const currentPath = router.asPath;
      const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
      router.push(loginUrl);
      return;
    }

    // Check admin role requirement
    if (requireAdmin && user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [isLoggedIn, isLoading, user, router, requireAuth, requireAdmin, redirectTo]);

  return {
    user,
    isLoggedIn,
    isLoading,
    isAdmin: user?.role === 'admin',
  };
};
