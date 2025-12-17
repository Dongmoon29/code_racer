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
  LEADERBOARD: '/leaderboard',
  RACE: '/race',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  USER_PROFILE: (userId: string) => `/users/${userId}`,

  // Game routes
  GAME_ROOM: (gameId: string) => `/game/${gameId}`,
  MATCHMAKING: '/matchmaking',

  // Admin routes
  ADMIN: '/admin',
  ADMIN_PROBLEMS: '/admin/problems',
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
    PROBLEMS: {
      LIST: '/api/problems',
      CREATE: '/api/problems',
      GET: (id: string) => `/api/problems/${id}`,
      UPDATE: (id: string) => `/api/problems/${id}`,
      DELETE: (id: string) => `/api/problems/${id}`,
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

  goToLeaderboard() {
    return this.push(ROUTES.LEADERBOARD);
  }

  goToRace() {
    return this.push(ROUTES.RACE);
  }

  goToSettings() {
    return this.push(ROUTES.SETTINGS);
  }

  goToProfile() {
    return this.push(ROUTES.PROFILE);
  }

  goToUserProfile(userId: string) {
    return this.push(ROUTES.USER_PROFILE(userId));
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

  goToAdminProblems() {
    return this.push(ROUTES.ADMIN_PROBLEMS);
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

  replaceToUserProfile(userId: string) {
    return this.replace(ROUTES.USER_PROFILE(userId));
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

  isValidProblemId(id: string): boolean {
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

  problemId: (id: string): boolean => {
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

  problemDetail: (id: string) => {
    if (!validateRoute.problemId(id)) {
      throw new Error(`Invalid Problem ID: ${id}`);
    }
    return `/problems/${id}`;
  },
};

export default RouterHelper;
