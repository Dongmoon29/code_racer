import { WEBSOCKET_CONSTANTS, TIMER_CONSTANTS } from '@/constants';
import { trackWebSocketError, createErrorHandler } from '@/lib/error-tracking';

export interface MatchingRequest {
  type: 'start_matching';
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface CancelRequest {
  type: 'cancel_matching';
}

export interface MatchingStatusMessage {
  type: 'matching_status';
  status: 'searching' | 'found' | 'cancelled';
  queue_position?: number;
  wait_time_seconds?: number;
  estimated_wait_seconds?: number;
}

export interface MatchFoundMessage {
  type: 'match_found';
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

export class MatchmakingWebSocketClient {
  private ws: WebSocket | null = null;
  private callbacks: MatchingWebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts =
    WEBSOCKET_CONSTANTS.MATCHMAKING.MAX_RECONNECT_ATTEMPTS;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isIntentionalDisconnect = false;
  private errorHandler = createErrorHandler(
    'MatchmakingWebSocketClient',
    'websocket_operation'
  );

  constructor(callbacks: MatchingWebSocketCallbacks = {}) {
    this.callbacks = callbacks;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsProtocol =
          window.location.protocol === 'https:' ? 'wss:' : 'ws:';

        let wsHost: string;
        if (process.env.NODE_ENV === 'production') {
          wsHost =
            process.env.NEXT_PUBLIC_WS_HOST ||
            'code-racer-651798881748.asia-northeast3.run.app';
        } else {
          wsHost =
            process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
            'http://localhost:8080';
          wsHost = wsHost.replace(/^https?:\/\//, '');
        }

        const wsUrl = `${wsProtocol}//${wsHost}/ws/matching`;

        // Security: Use sessionStorage instead of localStorage
        const token = sessionStorage.getItem('authToken');
        if (!token) {
          reject(new Error('No authentication token found'));
          return;
        }

        // Add token as query parameter (WebSocket limitation)
        const wsUrlWithToken = `${wsUrl}?token=${encodeURIComponent(token)}`;

        this.ws = new WebSocket(wsUrlWithToken);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.callbacks.onConnect?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as MatchingWebSocketMessage;
            this.handleMessage(message);
          } catch (error) {
            this.errorHandler(error, {
              action: 'parse_message',
              messageData: event.data,
            });
          }
        };

        this.ws.onclose = (event) => {
          console.log(
            'Matchmaking WebSocket disconnected:',
            event.code,
            event.reason
          );
          this.callbacks.onDisconnect?.();

          // Try reconnection if not intentional disconnect
          if (
            !this.isIntentionalDisconnect &&
            this.reconnectAttempts < this.maxReconnectAttempts
          ) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('Matchmaking WebSocket error:', error);
          this.callbacks.onError?.(error);
          reject(error);
        };
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
    console.log('🎯 Handling message type:', message.type);
    switch (message.type) {
      case 'matching_status':
        console.log('📊 Matching status update:', message);
        this.callbacks.onStatusUpdate?.(message);

        // If status is 'canceled', disconnect after a short delay
        if (message.status === 'canceled') {
          setTimeout(() => {
            this.disconnect();
          }, WEBSOCKET_CONSTANTS.MATCHMAKING.CANCEL_DISCONNECT_DELAY_MS);
        }
        break;
      case 'match_found':
        console.log('🎉 Match found!:', message);
        this.callbacks.onMatchFound?.(message);
        break;
      default:
        console.warn('Unknown matchmaking message type:', message);
    }
  }

  private attemptReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(
      WEBSOCKET_CONSTANTS.MATCHMAKING.RECONNECT_BASE_DELAY_MS *
        Math.pow(2, this.reconnectAttempts),
      WEBSOCKET_CONSTANTS.MATCHMAKING.MAX_RECONNECT_DELAY_MS
    ); // Maximum 10 seconds

    console.log(
      `Attempting to reconnect matchmaking WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch((error) => {
        this.errorHandler(error, {
          action: 'reconnect',
          reconnectAttempt: this.reconnectAttempts,
          delay,
        });
      });
    }, delay);
  }

  startMatching(difficulty: 'Easy' | 'Medium' | 'Hard') {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    const message: MatchingRequest = {
      type: 'start_matching',
      difficulty,
    };

    console.log('🚀 Sending start_matching message:', message);
    this.ws.send(JSON.stringify(message));
    console.log(
      '✅ Message sent successfully. Started matching with difficulty:',
      difficulty
    );
  }

  cancelMatching() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    const message: CancelRequest = {
      type: 'cancel_matching',
    };

    this.ws.send(JSON.stringify(message));
    console.log('Cancelled matching');
  }

  disconnect() {
    this.isIntentionalDisconnect = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log('Matchmaking WebSocket disconnected intentionally');
  }

  // Intentional disconnect after matchmaking completion (no error handling)
  disconnectAfterMatch() {
    this.isIntentionalDisconnect = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Call disconnect callback after matchmaking completion
    this.callbacks.onMatchmakingDisconnect?.();
    console.log('Matchmaking WebSocket disconnected after match found');
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export default MatchmakingWebSocketClient;
