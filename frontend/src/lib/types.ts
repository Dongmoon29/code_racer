export interface ApiErrorResponse {
  success: boolean;
  message: string;
  error_type?: string; // 추가: 에러 타입을 구분하기 위한 필드
}

export interface ApiSuccessResponse<T = unknown> {
  success: boolean;
  data?: T;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  game?: {
    id: string;
    creator: {
      id: string;
      name: string;
    };
    leetcode: {
      id: string;
      title: string;
      difficulty: string;
    };
    status: 'waiting' | 'playing' | 'finished' | 'closed';
    player_count: number;
    is_full: boolean;
    created_at: string;
  };
  is_winner?: boolean;
}
