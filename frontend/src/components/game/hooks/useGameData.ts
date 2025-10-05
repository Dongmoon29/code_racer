import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { matchApi } from '@/lib/api';
import { Game } from '@/types';
import axios, { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types';
import { createErrorHandler } from '@/lib/error-tracking';

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
  const errorHandler = createErrorHandler('useGameData', 'fetchGame');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['game', matchId],
    queryFn: async () => {
      try {
        const response = await matchApi.getGame(matchId);

        if (!response.game) {
          throw new Error('Game not found');
        }

        return response.game;
      } catch (err) {
        errorHandler(err, {
          matchId,
          action: 'fetchGame',
        });

        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError<ApiErrorResponse>;
          const errorMessage =
            axiosError.response?.data?.message || 'Failed to load game';

          // Redirect to dashboard for 404 errors
          if (axiosError.response?.status === 404) {
            router.push('/dashboard');
          }

          throw new Error(errorMessage);
        } else {
          throw new Error('An unexpected error occurred');
        }
      }
    },
    enabled: !!matchId,
    retry: (failureCount: number, error: Error) => {
      // Don't retry for 404 errors
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    game: data || null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
};
