// Centralized router management
import { NextRouter } from 'next/router';

// Route constants
export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  AUTH_CALLBACK: '/auth/callback',

  // Main app routes
  DASHBOARD: '/dashboard',
  DASHBOARD_RACE: '/dashboard/race',
  PROFILE: '/profile',

  // Game routes
  GAME_ROOM: (gameId: string) => `/game/${gameId}`,
  MATCHMAKING: '/matchmaking',

  // Admin routes
  ADMIN: '/admin',
  ADMIN_LEETCODE: '/admin/leetcode',
  ADMIN_USERS: '/admin/users',

  // API routes (for reference)
  API: {
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      EXCHANGE_TOKEN: '/api/auth/exchange-token',
    },
    USERS: {
      ME: '/api/users/me',
      UPDATE: '/api/users/update',
    },
    GAMES: {
      CREATE: '/api/games/create',
      GET: (gameId: string) => `/api/games/${gameId}`,
    },
    LEETCODE: {
      LIST: '/api/leetcode',
      CREATE: '/api/leetcode',
      GET: (id: string) => `/api/leetcode/${id}`,
      UPDATE: (id: string) => `/api/leetcode/${id}`,
      DELETE: (id: string) => `/api/leetcode/${id}`,
    },
  },
} as const;

// Route parameters type
export type RouteParams = {
  gameId?: string;
  id?: string;
};

// Router helper class
export class RouterHelper {
  private router: NextRouter;

  constructor(router: NextRouter) {
    this.router = router;
  }

  // Navigation methods
  push(path: string, options?: { shallow?: boolean }) {
    return this.router.push(path, undefined, options);
  }

  replace(path: string, options?: { shallow?: boolean }) {
    return this.router.replace(path, undefined, options);
  }

  back() {
    return this.router.back();
  }

  reload() {
    return this.router.reload();
  }

  // Specific route navigation methods
  goToLogin() {
    return this.push(ROUTES.LOGIN);
  }

  goToRegister() {
    return this.push(ROUTES.REGISTER);
  }

  goToDashboard() {
    return this.push(ROUTES.DASHBOARD);
  }

  goToDashboardRace() {
    return this.push(ROUTES.DASHBOARD_RACE);
  }

  goToProfile() {
    return this.push(ROUTES.PROFILE);
  }

  goToGameRoom(gameId: string) {
    return this.push(ROUTES.GAME_ROOM(gameId));
  }

  goToMatchmaking() {
    return this.push(ROUTES.MATCHMAKING);
  }

  goToAdmin() {
    return this.push(ROUTES.ADMIN);
  }

  goToAdminLeetCode() {
    return this.push(ROUTES.ADMIN_LEETCODE);
  }

  goToAdminUsers() {
    return this.push(ROUTES.ADMIN_USERS);
  }

  // Replace methods (for redirects)
  replaceToLogin() {
    return this.replace(ROUTES.LOGIN);
  }

  replaceToDashboard() {
    return this.replace(ROUTES.DASHBOARD);
  }

  replaceToGameRoom(gameId: string) {
    return this.replace(ROUTES.GAME_ROOM(gameId));
  }

  // Utility methods
  isCurrentRoute(route: string): boolean {
    return this.router.pathname === route;
  }

  isCurrentRoutePattern(pattern: string): boolean {
    return this.router.pathname.startsWith(pattern);
  }

  getCurrentRoute(): string {
    return this.router.pathname;
  }

  getQuery(): Record<string, string | string[] | undefined> {
    return this.router.query;
  }

  getQueryParam(key: string): string | string[] | undefined {
    return this.router.query[key];
  }

  // Route validation
  isValidGameId(gameId: string): boolean {
    // UUID v4 pattern validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(gameId);
  }

  isValidLeetCodeId(id: string): boolean {
    // Check if it's a valid UUID or numeric ID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const numericRegex = /^\d+$/;
    return uuidRegex.test(id) || numericRegex.test(id);
  }
}

// Hook for using router helper
export const useRouterHelper = (router: NextRouter): RouterHelper => {
  return new RouterHelper(router);
};

// Utility functions for direct use
export const createRouterHelper = (router: NextRouter): RouterHelper => {
  return new RouterHelper(router);
};

// Route validation utilities
export const validateRoute = {
  gameId: (gameId: string): boolean => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(gameId);
  },

  leetCodeId: (id: string): boolean => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const numericRegex = /^\d+$/;
    return uuidRegex.test(id) || numericRegex.test(id);
  },
};

// Type-safe route builder
export const buildRoute = {
  gameRoom: (gameId: string) => {
    if (!validateRoute.gameId(gameId)) {
      throw new Error(`Invalid game ID: ${gameId}`);
    }
    return ROUTES.GAME_ROOM(gameId);
  },

  leetCodeDetail: (id: string) => {
    if (!validateRoute.leetCodeId(id)) {
      throw new Error(`Invalid LeetCode ID: ${id}`);
    }
    return `/leetcode/${id}`;
  },
};

export default RouterHelper;
