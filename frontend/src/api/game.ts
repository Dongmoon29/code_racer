import { ApiResponse } from '@/types';
import axios from 'axios';

export const closeGame = async (gameId: string): Promise<ApiResponse> => {
  const response = await axios.post(`/games/${gameId}/close`);
  return response.data;
};
//
