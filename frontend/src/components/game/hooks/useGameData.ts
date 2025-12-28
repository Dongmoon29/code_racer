import { useRouter } from 'next/router';
import { matchApi } from '@/lib/api';
import { Game } from '@/types';
import axios, { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types';
import { useApiQuery } from '@/hooks/useApiQuery';

interface UseGameDataProps {
  matchId: string;
}

interface UseGameDataReturn {
  game: Game | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useGameData = ({
  matchId,
}: UseGameDataProps): UseGameDataReturn => {
  const router = useRouter();

  const { data, isLoading, error, refetch } = useApiQuery<Game>({
    queryKey: ['game', matchId],
    queryFn: async () => {
      const response = await matchApi.getGame(matchId);

      if (!response.game) {
        throw new Error('Game not found');
      }

      // Handle 404 errors by redirecting to dashboard
      return response.game;
    },
    enabled: !!matchId,
    errorContext: { component: 'useGameData', action: 'fetchGame', matchId },
    retry: (failureCount: number, error: unknown) => {
      // Don't retry for 404 errors
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        router.push('/dashboard');
        return false;
      }
      return failureCount < 3;
    },
  });

  return {
    game: data || null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
};
