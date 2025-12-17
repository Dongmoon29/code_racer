// Supported programming languages
export const SUPPORTED_LANGUAGES = {
  PYTHON: 'python',
  JAVASCRIPT: 'javascript',
  GO: 'go',
} as const;

export type SupportedLanguage =
  (typeof SUPPORTED_LANGUAGES)[keyof typeof SUPPORTED_LANGUAGES];

// Language display names
export const LANGUAGE_DISPLAY_NAMES = {
  [SUPPORTED_LANGUAGES.PYTHON]: 'Python',
  [SUPPORTED_LANGUAGES.JAVASCRIPT]: 'JavaScript',
  [SUPPORTED_LANGUAGES.GO]: 'Go',
} as const;

// Language file extensions
export const LANGUAGE_EXTENSIONS = {
  [SUPPORTED_LANGUAGES.PYTHON]: 'py',
  [SUPPORTED_LANGUAGES.JAVASCRIPT]: 'js',
  [SUPPORTED_LANGUAGES.GO]: 'go',
} as const;

// Import WebSocket message types from dedicated file
import { WEBSOCKET_MESSAGE_TYPES } from './websocket';

// WebSocket related constants
export const WEBSOCKET_CONSTANTS = {
  // Connection settings
  CONNECTION: {
    MAX_RECONNECT_ATTEMPTS: 5,
    RECONNECT_BASE_DELAY_MS: 1000,
    MAX_RECONNECT_DELAY_MS: 30000,
    PING_INTERVAL_MS: 30000,
    PONG_WAIT_MS: 60000,
    MAX_MESSAGE_SIZE: 512,
  },

  // Matchmaking settings
  MATCHMAKING: {
    MAX_RECONNECT_ATTEMPTS: 3,
    REDIRECT_DELAY_MS: 1500,
    CANCEL_DISCONNECT_DELAY_MS: 50,
    RECONNECT_BASE_DELAY_MS: 1000,
    MAX_RECONNECT_DELAY_MS: 10000,
  },

  // Close codes
  CLOSE_CODES: {
    NORMAL_CLOSURE: 1000,
    GOING_AWAY: 1001,
    PROTOCOL_ERROR: 1002,
    UNSUPPORTED_DATA: 1003,
    NO_STATUS_RECEIVED: 1005,
    ABNORMAL_CLOSURE: 1006,
    INVALID_FRAME_PAYLOAD_DATA: 1007,
    POLICY_VIOLATION: 1008,
    MESSAGE_TOO_BIG: 1009,
    MANDATORY_EXTENSION: 1010,
    INTERNAL_ERROR: 1011,
    SERVICE_RESTART: 1012,
    TRY_AGAIN_LATER: 1013,
    BAD_GATEWAY: 1014,
    TLS_HANDSHAKE: 1015,
  },

  // Message types (re-exported from websocket constants)
  MESSAGE_TYPES: WEBSOCKET_MESSAGE_TYPES,

  // Matching statuses
  MATCHING_STATUSES: {
    SEARCHING: 'searching',
    CANCELED: 'canceled',
    FOUND: 'found',
    ERROR: 'error',
  },
} as const;

// Timer related constants
export const TIMER_CONSTANTS = {
  // Common intervals
  INTERVALS: {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
  },

  // Cache TTL
  CACHE_TTL: {
    SHORT: 5 * 60 * 1000, // 5 minutes
    MEDIUM: 10 * 60 * 1000, // 10 minutes
    LONG: 30 * 60 * 1000, // 30 minutes
  },

  // UI delays
  UI_DELAYS: {
    SHORT: 100,
    MEDIUM: 200,
    LONG: 500,
    REDIRECT: 1500,
  },
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Default values
export const DEFAULT_VALUES = {
  // Problem form
  TIME_LIMIT: 1000,
  MEMORY_LIMIT: 128,

  // Pagination
  PAGE_SIZE: 20,
  DEFAULT_PAGE: 1,

  // Validation
  MIN_TITLE_LENGTH: 1,
  MIN_DESCRIPTION_LENGTH: 1,
  MIN_FUNCTION_NAME_LENGTH: 1,

  // Error tracking
  DEFAULT_ERROR_LIMIT: 10,
  MAX_ERRORS_TO_KEEP: 100,

  // Revalidation intervals (in seconds)
  REVALIDATE_INTERVALS: {
    HOUR: 3600,
    DAY: 86400,
  },
} as const;

// Matchmaking state constants
export const MATCHING_STATE = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  SEARCHING: 'searching',
  FOUND: 'found',
  ERROR: 'error',
} as const;

export type MatchingState =
  (typeof MATCHING_STATE)[keyof typeof MATCHING_STATE];
