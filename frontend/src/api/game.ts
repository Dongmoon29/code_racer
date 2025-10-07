import { ApiResponse } from '@/types';
import axios from 'axios';

export const closeGame = async (gameId: string): Promise<ApiResponse> => {
  const response = await axios.post(`/games/${gameId}/close`);
  return response.data;
};

export const createSinglePlayerMatch = async (
  difficulty: string
): Promise<ApiResponse> => {
  const response = await axios.post('/api/matches/single', {
    difficulty,
  });
  return response.data;
};
//
