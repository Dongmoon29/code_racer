import { useAuthStore } from "@/stores/authStore";

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Auth initialization is handled in _app.tsx
  // This hook just provides the current auth state
  return { user, isLoggedIn, isLoading };
};
