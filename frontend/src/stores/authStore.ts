import { create } from "zustand";
import { AxiosError } from "axios";
import { authApi } from "@/lib/api";
import { createErrorHandler } from "@/lib/error-tracking";
import { clearAccessToken } from "@/lib/access-token";

export type User = {
  id: string;
  name: string;
  email: string;
  profile_image?: string;
  homepage?: string;
  linkedin?: string;
  oauthProvider?: string;
  role?: string;
  fav_language?: string;
  github?: string;
  company?: string;
  job_title?: string;
  rating?: number;
  created_at?: string;
};

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true, // Start as true to prevent premature redirects
  login: (user: User) => {
    set({ user, isLoggedIn: true });
  },
  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      const errorHandler = createErrorHandler("authStore", "logout");
      errorHandler(error, { userId: get().user?.id });
    } finally {
      clearAccessToken();

      set({
        user: null,
        isLoggedIn: false,
        isLoading: false,
      });
      window.location.href = "/login";
    }
  },
  initializeAuth: async () => {
    try {
      set({ isLoading: true });

      // Remove credentials left by the previous sessionStorage-based scheme.
      sessionStorage.removeItem("authToken");
      const response = await authApi.refresh();
      if (response.success) {
        // Refresh only returns the compact authentication user. Hydrate the
        // full profile so dashboard-only fields stay available after reload.
        const currentUserResponse = await authApi.getCurrentUser();
        set({
          user: currentUserResponse.success
            ? currentUserResponse.data
            : response.data.user,
          isLoggedIn: true,
        });
      } else {
        clearAccessToken();
        set({ user: null, isLoggedIn: false });
      }
    } catch (error) {
      const errorHandler = createErrorHandler("authStore", "initializeAuth");
      clearAccessToken();
      if (!(error instanceof AxiosError && error.response?.status === 401)) {
        errorHandler(error, { userId: get().user?.id });
      }
      set({ user: null, isLoggedIn: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
