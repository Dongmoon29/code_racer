import { ApiResponse } from '@/types';
import api from '@/lib/api';

export const closeGame = async (gameId: string): Promise<ApiResponse> => {
  const response = await api.post(`/games/${gameId}/close`);
  return response.data;
};

export const createSinglePlayerMatch = async (
  difficulty: string
): Promise<ApiResponse<{ id: string }>> => {
  const response = await api.post('/matches/single', {
    difficulty,
  });
  return response.data;
};
