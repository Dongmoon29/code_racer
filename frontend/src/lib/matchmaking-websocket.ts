// 매치메이킹 전용 WebSocket 클라이언트
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
  onError?: (error: Event) => void;
}

export class MatchmakingWebSocketClient {
  private ws: WebSocket | null = null;
  private callbacks: MatchingWebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isIntentionalDisconnect = false;

  constructor(callbacks: MatchingWebSocketCallbacks = {}) {
    this.callbacks = callbacks;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // WebSocket URL 구성
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

        // JWT 토큰 가져오기
        const token =
          localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) {
          reject(new Error('No authentication token found'));
          return;
        }

        // 매치메이킹 전용 엔드포인트로 연결
        const wsUrl = `${wsProtocol}//${wsHost}/ws/matching?token=${encodeURIComponent(
          token
        )}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('Matchmaking WebSocket connected');
          this.reconnectAttempts = 0;
          this.callbacks.onConnect?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            console.log('📨 Received WebSocket message:', event.data);
            const message = JSON.parse(event.data) as MatchingWebSocketMessage;
            console.log('📨 Parsed message:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse matchmaking message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log(
            'Matchmaking WebSocket disconnected:',
            event.code,
            event.reason
          );
          this.callbacks.onDisconnect?.();

          // 의도적인 연결 해제가 아니면 재연결 시도
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
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000); // 최대 10초

    console.log(
      `Attempting to reconnect matchmaking WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
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

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export default MatchmakingWebSocketClient;
