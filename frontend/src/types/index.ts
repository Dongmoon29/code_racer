// ============================================
// Common API Response Types
// ============================================

/**
 * 에러 응답 타입
 * Backend에서 에러 발생 시 반환하는 표준 형식
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  error_type?: string;
}

/**
 * 성공 응답 기본 타입
 * 모든 성공 응답은 이 인터페이스를 확장
 */
export interface ApiSuccessResponse<T = void> {
  success: true;
  data: T;
  message?: string;
}

/**
 * API 응답의 Union 타입
 * Success 또는 Error 중 하나
 */
export type ApiResponse<T = void> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * API 응답 타입 가드
 * 성공 응답인지 확인
 */
export function isApiSuccess<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * API 응답 타입 가드
 * 에러 응답인지 확인
 */
export function isApiError<T>(
  response: ApiResponse<T>
): response is ApiErrorResponse {
  return response.success === false;
}

// ============================================
// Auth API Response Types
// ============================================

export interface AuthTokenData {
  token: string;
  user: User;
}

export type LoginResponse = ApiResponse<AuthTokenData>;
export type RegisterResponse = ApiResponse<AuthTokenData>;
export type ExchangeTokenResponse = ApiResponse<AuthTokenData>;
export type GetCurrentUserResponse = ApiResponse<User>;

// ============================================
// Match/Game API Response Types
// ============================================

export interface MatchResponse {
  id: string;
  player_a?: User & { rating?: number };
  player_b?: User & { rating?: number };
  winner?: User & { rating?: number };
  winner_execution_time_seconds?: number;
  winner_memory_usage_kb?: number;
  winner_rating_delta?: number;
  loser_rating_delta?: number;
  problem: ProblemDetail;
  status: 'waiting' | 'playing' | 'finished' | 'closed';
  mode: 'ranked_pvp' | 'casual_pvp' | 'single';
  started_at?: string;
  ended_at?: string;
  created_at: string;
}

export type GetMatchResponse = ApiResponse<MatchResponse>;

export interface SubmitSolutionData {
  success: boolean;
  message: string;
  is_winner: boolean;
}

export type SubmitSolutionResponse = ApiResponse<SubmitSolutionData>;

// ============================================
// Problem API Response Types
// ============================================

export type GetProblemResponse = ApiResponse<ProblemDetail>;
export type ListProblemsResponse = ApiResponse<ProblemSummary[]>;
export type CreateProblemResponse = ApiResponse<ProblemDetail>;
export type UpdateProblemResponse = ApiResponse<ProblemDetail>;
export type DeleteProblemResponse = ApiResponse<{ message: string }>;

// ============================================
// User Profile API Response Types
// ============================================

export type GetUserProfileResponse = ApiResponse<UserProfile>;
export type UpdateUserProfileResponse = ApiResponse<UserProfile>;

// Problem 관련 타입
export interface Example {
  id: string;
  problem_id: string;
  input: string;
  output: string;
  explanation: string;
}

// Create/Update payload shape (no DB identifiers)
export interface ExampleRequest {
  input: string;
  output: string;
  explanation: string;
}

export interface TestCase {
  input: string;
  expected_output: string;
}

export interface IOSchema {
  param_types: string | string[]; // Can come as JSON string from backend
  return_type: string;
}

export interface IOTemplate {
  id: string;
  problem_id: string;
  language: string;
  code: string;
}

// Create/Update payload shape (no DB identifiers)
export interface IOTemplateRequest {
  language: string;
  code: string;
}

export interface CreateProblemRequest {
  title: string;
  description: string;
  examples: ExampleRequest[];
  constraints: string;
  test_cases: TestCase[];
  expected_outputs: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  input_format: string;
  output_format: string;
  function_name: string;
  io_schema: IOSchema;
  io_templates: IOTemplateRequest[];
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
  examples: ExampleRequest[];
  constraints: string;
  test_cases: TestCase[];
  expected_outputs: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  input_format: string;
  output_format: string;
  function_name: string;
  io_schema: IOSchema;
  io_templates: IOTemplateRequest[];
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

// User-related types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  rating?: number;
  role?: string; // user role (e.g., 'admin', 'user')
  profile_image?: string;
  homepage?: string;
  linkedin?: string;
  oauthProvider?: string;
  fav_language?: string;
  github?: string;
  company?: string;
  job_title?: string;
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

// Additional game-related types
export interface Game {
  id: string;
  // Preferred naming aligned with backend
  playerA?: {
    id: string;
    email: string;
    name: string;
    created_at: string;
    rating?: number;
  };
  playerB?: {
    id: string;
    email: string;
    name: string;
    created_at: string;
    rating?: number;
  };
  winner?: {
    id: string;
    email: string;
    name: string;
    created_at: string;
    rating?: number;
  };
  // Winner metrics captured at match completion (if available)
  winner_execution_time_seconds?: number;
  winner_memory_usage_kb?: number;
  winner_rating_delta?: number;
  loser_rating_delta?: number;
  problem: ProblemDetail;
  status: 'waiting' | 'playing' | 'finished' | 'closed';
  mode: 'ranked_pvp' | 'casual_pvp' | 'single';
  started_at?: string;
  ended_at?: string;
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

// User profile related types
export interface UserProfile {
  homepage?: string;
  linkedin?: string;
  github?: string;
  company?: string;
  job_title?: string;
  fav_language?: string;
}
