import { LeetCodeDetail } from '@/lib/api';

export interface Game {
  id: string;
  creator: {
    id: string;
    email: string;
    name: string;
    created_at: string;
  };
  opponent?: {
    id: string;
    email: string;
    name: string;
    created_at: string;
  };
  winner?: {
    id: string;
    email: string;
    name: string;
    created_at: string;
  };
  leetcode: LeetCodeDetail;
  status: 'waiting' | 'playing' | 'finished' | 'closed';
  started_at?: string;
  created_at: string;
  player_count: number;
  is_full: boolean;
}

export interface SubmitResult {
  success: boolean;
  message: string;
  is_winner: boolean;
}
