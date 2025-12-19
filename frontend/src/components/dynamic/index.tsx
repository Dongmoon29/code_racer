// Dynamic imports for code splitting
import dynamic from 'next/dynamic';

// Game components with loading fallbacks
export const GameRoom = dynamic(() => import('@/components/game/GameRoom'), {
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
  ssr: false, // Disable SSR for game components to avoid hydration issues
});

export const MatchingScreen = dynamic(
  () => import('@/components/game/MatchingScreen'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  }
);

export const DifficultySelector = dynamic(
  () => import('@/components/game/DifficultySelector'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  }
);

// Admin components
export const ProblemForm = dynamic(
  () => import('@/components/admin/ProblemForm'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  }
);

export const ProblemList = dynamic(
  () => import('@/components/admin/ProblemList'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  }
);

// Auth components
export const LoginForm = dynamic(() => import('@/components/auth/LoginForm'), {
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
  ssr: false,
});

export const RegisterForm = dynamic(
  () => import('@/components/auth/RegisterForm'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  }
);

// UI components that are heavy
// Note: CodeRacerLoader is deprecated, use Loader component instead

export const RecentCommits = dynamic(
  () => import('@/components/ui/RecentCommits'),
  {
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  }
);
