// WebSocket message type constants
// These should match the backend constants in backend/internal/constants/message_types.go
export const WEBSOCKET_MESSAGE_TYPES = {
  // Authentication messages
  AUTH: 'auth',

  // Connection management
  PING: 'ping',
  PONG: 'pong',

  // Game-related messages
  CODE_UPDATE: 'code_update',
  GAME_FINISHED: 'game_finished',

  // Real-time scoring messages
  SUBMISSION_STARTED: 'submission_started',
  TEST_CASE_RUNNING: 'test_case_running',
  TEST_CASE_COMPLETED: 'test_case_completed',
  SUBMISSION_COMPLETED: 'submission_completed',
  SUBMISSION_FAILED: 'submission_failed',

  // Matchmaking messages
  START_MATCHING: 'start_matching',
  CANCEL_MATCHING: 'cancel_matching',
  MATCHING_STATUS: 'matching_status',
  MATCH_FOUND: 'match_found',

  // Error handling
  ERROR: 'error',
} as const;

// Type for WebSocket message types
export type WebSocketMessageType =
  (typeof WEBSOCKET_MESSAGE_TYPES)[keyof typeof WEBSOCKET_MESSAGE_TYPES];

// Message type categories
export const MESSAGE_TYPE_CATEGORIES = {
  AUTH: 'auth',
  CONNECTION: 'connection',
  GAME: 'game',
  MATCHMAKING: 'matchmaking',
  ERROR: 'error',
} as const;

export type MessageTypeCategory =
  (typeof MESSAGE_TYPE_CATEGORIES)[keyof typeof MESSAGE_TYPE_CATEGORIES];

// Helper function to get message type category
export const getMessageTypeCategory = (
  messageType: string
): MessageTypeCategory => {
  switch (messageType) {
    case WEBSOCKET_MESSAGE_TYPES.AUTH:
      return MESSAGE_TYPE_CATEGORIES.AUTH;
    case WEBSOCKET_MESSAGE_TYPES.PING:
    case WEBSOCKET_MESSAGE_TYPES.PONG:
      return MESSAGE_TYPE_CATEGORIES.CONNECTION;
    case WEBSOCKET_MESSAGE_TYPES.CODE_UPDATE:
    case WEBSOCKET_MESSAGE_TYPES.GAME_FINISHED:
    case WEBSOCKET_MESSAGE_TYPES.SUBMISSION_STARTED:
    case WEBSOCKET_MESSAGE_TYPES.TEST_CASE_RUNNING:
    case WEBSOCKET_MESSAGE_TYPES.TEST_CASE_COMPLETED:
    case WEBSOCKET_MESSAGE_TYPES.SUBMISSION_COMPLETED:
    case WEBSOCKET_MESSAGE_TYPES.SUBMISSION_FAILED:
      return MESSAGE_TYPE_CATEGORIES.GAME;
    case WEBSOCKET_MESSAGE_TYPES.START_MATCHING:
    case WEBSOCKET_MESSAGE_TYPES.CANCEL_MATCHING:
    case WEBSOCKET_MESSAGE_TYPES.MATCHING_STATUS:
    case WEBSOCKET_MESSAGE_TYPES.MATCH_FOUND:
      return MESSAGE_TYPE_CATEGORIES.MATCHMAKING;
    case WEBSOCKET_MESSAGE_TYPES.ERROR:
    default:
      return MESSAGE_TYPE_CATEGORIES.ERROR;
  }
};
