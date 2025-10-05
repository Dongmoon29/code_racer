import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

export const useAuth = () => {
  const { user, isLoggedIn, isLoading } = useAuthStore();

  // Auth initialization is handled in _app.tsx
  // This hook just provides the current auth state
  return { user, isLoggedIn, isLoading };
};
