// 공통 API 타입
export interface ApiErrorResponse {
  success: boolean;
  message: string;
  error_type?: string;
}

export interface ApiSuccessResponse<T = unknown> {
  success: boolean;
  data?: T;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  game?: {
    id: string;
    problem: {
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

// Problem 관련 타입
export interface Example {
  id: string;
  problem_id: string;
  input: string;
  output: string;
  explanation: string;
}

export interface TestCase {
  input: string;
  expected_output: string;
}

export interface IOSchema {
  param_types: string[];
  return_type: string;
}

export interface IOTemplate {
  id: string;
  problem_id: string;
  language: string;
  code: string;
}

export interface CreateProblemRequest {
  title: string;
  description: string;
  examples: Example[];
  constraints: string;
  test_cases: TestCase[];
  expected_outputs: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  input_format: string;
  output_format: string;
  function_name: string;
  io_schema: IOSchema;
  io_templates: IOTemplate[];
  time_limit?: number;
  memory_limit?: number;
}

export interface UpdateProblemRequest extends Partial<CreateProblemRequest> {
  id: string;
}

export interface ProblemSummary {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  created_at: string;
  updated_at: string;
}

export interface ProblemDetail extends ProblemSummary {
  description: string;
  examples: Example[];
  constraints: string;
  test_cases: TestCase[];
  expected_outputs: string[];
  input_format: string;
  output_format: string;
  function_name: string;
  io_schema: IOSchema;
  io_templates: IOTemplate[];
  time_limit: number;
  memory_limit: number;
}

export interface ProblemFormData {
  id?: string;
  title: string;
  description: string;
  examples: Example[];
  constraints: string;
  test_cases: TestCase[];
  expected_outputs: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  input_format: string;
  output_format: string;
  function_name: string;
  io_schema: IOSchema;
  io_templates: IOTemplate[];
  time_limit: number;
  memory_limit: number;
  created_at?: string;
  updated_at?: string;
}

// 게임 관련 타입
export type Language = 'javascript' | 'python' | 'go' | 'java' | 'cpp';
export type GameDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  is_ready?: boolean;
  finish_time?: number;
  solution_valid?: boolean;
}

export interface GameState {
  id: string;
  status: 'waiting' | 'playing' | 'finished' | 'closed';
  players: Player[];
  problem: ProblemDetail;
  start_time?: string;
  time_limit: number;
}

// 사용자 관련 타입
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  rating?: number;
  created_at: string;
}

export interface AuthUser extends User {
  token: string;
}

// UI 컴포넌트 타입
export interface ButtonVariant {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  fullWidth?: boolean;
}

export interface SpinnerVariant {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export interface AlertVariant {
  variant?: 'default' | 'destructive' | 'warning' | 'success' | 'info';
}

// 게임 관련 추가 타입
export interface Game {
  id: string;
  // Preferred naming aligned with backend
  playerA?: {
    id: string;
    email: string;
    name: string;
    created_at: string;
  };
  playerB?: {
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
  problem: ProblemDetail;
  status: 'waiting' | 'playing' | 'finished' | 'closed';
  mode: 'ranked_pvp' | 'casual_pvp' | 'single';
  started_at?: string;
  created_at: string;
  player_count: number;
  is_full: boolean;
}

// Shared domain types (match and difficulty)
export type MatchMode = 'ranked_pvp' | 'casual_pvp' | 'single';
export type MatchStatus = 'waiting' | 'playing' | 'finished' | 'closed';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SubmitResult {
  success: boolean;
  message: string;
  is_winner: boolean;
}

export interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}
