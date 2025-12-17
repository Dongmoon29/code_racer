import { WEBSOCKET_CONSTANTS } from '@/constants';
import { WEBSOCKET_MESSAGE_TYPES } from '@/constants/websocket';
import { BaseWebSocketClient } from './websocket/base';

export interface MatchingRequest {
  type: typeof WEBSOCKET_MESSAGE_TYPES.START_MATCHING;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  mode: 'casual_pvp' | 'ranked_pvp' | 'single';
}

export interface CancelRequest {
  type: typeof WEBSOCKET_MESSAGE_TYPES.CANCEL_MATCHING;
}

export interface MatchingStatusMessage {
  type: typeof WEBSOCKET_MESSAGE_TYPES.MATCHING_STATUS;
  status: 'searching' | 'found' | 'canceled';
  queue_position?: number;
  wait_time_seconds?: number;
  estimated_wait_seconds?: number;
}

export interface MatchFoundMessage {
  type: typeof WEBSOCKET_MESSAGE_TYPES.MATCH_FOUND;
  game_id: string;
  problem: {
    id: string;
    title: string;
    difficulty: string;
    description?: string;
  };
  opponent: {
    id: string;
    name: string;
  };
}

export type MatchingWebSocketMessage =
  | MatchingStatusMessage
  | MatchFoundMessage;

export interface MatchingWebSocketCallbacks {
  onStatusUpdate?: (message: MatchingStatusMessage) => void;
  onMatchFound?: (message: MatchFoundMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMatchmakingDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export class MatchmakingWebSocketClient extends BaseWebSocketClient {
  private callbacks: MatchingWebSocketCallbacks = {};

  constructor(callbacks: MatchingWebSocketCallbacks = {}) {
    super(
      'MatchmakingWebSocketClient',
      WEBSOCKET_CONSTANTS.MATCHMAKING.MAX_RECONNECT_ATTEMPTS,
      WEBSOCKET_CONSTANTS.MATCHMAKING.RECONNECT_BASE_DELAY_MS,
      WEBSOCKET_CONSTANTS.MATCHMAKING.MAX_RECONNECT_DELAY_MS
    );
    this.callbacks = callbacks;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.buildWebSocketUrl('/ws/matching');
        this.ws = new WebSocket(wsUrl);

        this.setupEventHandlers(
          () => {
            this.callbacks.onConnect?.();
            resolve();
          },
          (event) => {
            const messages = this.parseMessage<MatchingWebSocketMessage>(
              event.data as string
            );
            messages.forEach((message) => this.handleMessage(message));
          },
          (event) => {
            if (process.env.NODE_ENV === 'development') {
              console.log(
                'Matchmaking WebSocket disconnected:',
                event.code,
                event.reason
              );
            }
            this.callbacks.onDisconnect?.();

            // Try reconnection if not intentional disconnect
            if (!this.isIntentionalDisconnect) {
              this.attemptReconnect(() => {
                this.connect().catch((error) => {
                  this.errorHandler(error, {
                    action: 'reconnect',
                    reconnectAttempt: this.reconnectAttempts,
                  });
                });
              });
            }
          },
          (error) => {
            this.callbacks.onError?.(error);
            reject(error);
          }
        );
      } catch (error) {
        this.errorHandler(error, {
          action: 'connect',
          reconnectAttempt: this.reconnectAttempts,
        });
        reject(error);
      }
    });
  }

  private handleMessage(message: MatchingWebSocketMessage) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎯 Handling message type:', message.type);
    }
    switch (message.type) {
      case WEBSOCKET_MESSAGE_TYPES.MATCHING_STATUS:
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Matching status update:', message);
        }
        this.callbacks.onStatusUpdate?.(message);

        // If status is 'canceled', disconnect after a short delay
        if (message.status === 'canceled') {
          setTimeout(() => {
            this.disconnect();
          }, WEBSOCKET_CONSTANTS.MATCHMAKING.CANCEL_DISCONNECT_DELAY_MS);
        }
        break;
      case WEBSOCKET_MESSAGE_TYPES.MATCH_FOUND:
        if (process.env.NODE_ENV === 'development') {
          console.log('🎉 Match found!:', message);
        }
        this.callbacks.onMatchFound?.(message);
        break;
      default:
        if (process.env.NODE_ENV === 'development') {
          console.warn('Unknown matchmaking message type:', message);
        }
    }
  }

  startMatching(
    difficulty: 'Easy' | 'Medium' | 'Hard',
    mode: 'casual_pvp' | 'ranked_pvp' | 'single' = 'casual_pvp'
  ) {
    const message: MatchingRequest = {
      type: WEBSOCKET_MESSAGE_TYPES.START_MATCHING,
      difficulty,
      mode,
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Sending start_matching message:', message);
    }

    this.sendMessage(message);

    if (process.env.NODE_ENV === 'development') {
      console.log(
        '✅ Message sent successfully. Started matching with difficulty:',
        difficulty
      );
    }
  }

  cancelMatching() {
    const message: CancelRequest = {
      type: WEBSOCKET_MESSAGE_TYPES.CANCEL_MATCHING,
    };

    this.sendMessage(message);

    if (process.env.NODE_ENV === 'development') {
      console.log('Cancelled matching');
    }
  }

  // Intentional disconnect after matchmaking completion (no error handling)
  disconnectAfterMatch() {
    this.isIntentionalDisconnect = true;
    this.cleanup();

    // Call disconnect callback after matchmaking completion
    this.callbacks.onMatchmakingDisconnect?.();
    if (process.env.NODE_ENV === 'development') {
      console.log('Matchmaking WebSocket disconnected after match found');
    }
  }
}

export default MatchmakingWebSocketClient;
