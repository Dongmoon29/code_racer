import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { matchApi } from '@/lib/api';
import { Game } from '@/types';
import axios, { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/types';

interface UseGameDataProps {
  matchId: string;
}

interface UseGameDataReturn {
  game: Game | null;
  loading: boolean;
  error: string | null;
  fetchGame: () => Promise<void>;
}

export const useGameData = ({ matchId }: UseGameDataProps): UseGameDataReturn => {
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchGame = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await matchApi.getGame(matchId);
      
      if (response.game) {
        setGame(response.game);
      } else {
        setError('Game not found');
      }
    } catch (err) {
      console.error('Failed to fetch game:', err);
      
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        const errorMessage = axiosError.response?.data?.message || 'Failed to load game';
        setError(errorMessage);
        
        // 404 에러인 경우 대시보드로 리다이렉트
        if (axiosError.response?.status === 404) {
          router.push('/dashboard');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [matchId, router]);
  
  useEffect(() => {
    fetchGame();
  }, [fetchGame]);
  
  return {
    game,
    loading,
    error,
    fetchGame,
  };
};
