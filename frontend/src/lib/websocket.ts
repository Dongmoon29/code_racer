import { useState, useEffect, useRef, useCallback } from 'react';
import { WEBSOCKET_CONSTANTS } from '@/constants';
import { createErrorHandler } from '@/lib/error-tracking';

// WebSocket related type definitions
export interface WebSocketMessage {
  type: string;
  game_id: string;
  user_id?: string;
  code?: string;
  winner_id?: string;
  payload?: unknown;
  message?: string;
  details?: string;
}

export interface CodeUpdateMessage extends WebSocketMessage {
  type: 'code_update';
  code: string;
  user_id?: string; // Backend sends as 'user_id' in JSON
}

// WebSocket connection management class
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: ((message: WebSocketMessage) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts =
    WEBSOCKET_CONSTANTS.CONNECTION.MAX_RECONNECT_ATTEMPTS;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPingTime = 0;
  private errorHandler = createErrorHandler(
    'WebSocketClient',
    'websocket_operation'
  );

  constructor(private gameId: string) {
    this.connect();
  }

  private connect() {
    // WebSocket URL configuration
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // Get WebSocket URL from environment variables
    let wsUrl: string;
    if (process.env.NEXT_PUBLIC_WS_URL) {
      // Case when full URL is set in environment variables
      wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/${this.gameId}`;
    } else {
      // Default configuration when environment variables are not set
      let wsHost: string;
      if (process.env.NODE_ENV === 'production') {
        // Production: get backend domain from environment variables
        wsHost =
          process.env.NEXT_PUBLIC_WS_HOST ||
          'code-racer-651798881748.asia-northeast3.run.app';
      } else {
        // Development: use environment variables or default values
        wsHost =
          process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
          'http://localhost:8080';
        wsHost = wsHost.replace(/^https?:\/\//, '');
      }
      wsUrl = `${wsProtocol}//${wsHost}/ws/${this.gameId}`;
    }

    // WebSocket authentication: Use token from sessionStorage
    // Note: Backend sets httpOnly cookie, but WebSocket connections may not reliably send cookies
    // So we use query parameter as primary method, cookie as fallback (backend checks both)
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      console.error('No authentication token found for WebSocket connection');
      return;
    }

    // Add token as query parameter (WebSocket doesn't support custom headers reliably)
    // Backend middleware checks: cookie > Authorization header > query parameter
    wsUrl = `${wsUrl}?token=${encodeURIComponent(token)}`;

    // Create WebSocket connection
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.startPingInterval();

      // Send authentication message after connection (optional)
      this.sendAuthMessage(token);
    };

    this.ws.onmessage = (event) => {
      const raw = event.data;
      // Some backends may concatenate multiple JSON objects with newlines in a single frame
      const chunks = typeof raw === 'string' ? raw.split('\n') : [raw];

      for (const chunk of chunks) {
        const trimmed = typeof chunk === 'string' ? chunk.trim() : chunk;
        if (!trimmed) continue;
        try {
          const message = JSON.parse(trimmed) as WebSocketMessage;
          this.handleMessage(message);
        } catch (error) {
          // Report both the full payload and the specific chunk that failed
          this.errorHandler(error, {
            action: 'parse_message',
            messageData: raw,
            chunk: trimmed,
            gameId: this.gameId,
          });
        }
      }
    };

    this.ws.onclose = () => {
      this.handleDisconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(
        WEBSOCKET_CONSTANTS.CONNECTION.RECONNECT_BASE_DELAY_MS *
          Math.pow(2, this.reconnectAttempts),
        WEBSOCKET_CONSTANTS.CONNECTION.MAX_RECONNECT_DELAY_MS
      );

      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error(
        'Max reconnection attempts reached. WebSocket connection failed.'
      );
    }
  }

  private startPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send ping message (browser WebSocket doesn't support ping method)
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        this.lastPingTime = Date.now();
      }
    }, WEBSOCKET_CONSTANTS.CONNECTION.PING_INTERVAL_MS); // Ping every 30 seconds
  }

  private handleMessage(message: WebSocketMessage) {
    if (message.type === 'pong') {
      return;
    }

    this.messageHandlers.forEach((handler) => handler(message));
  }

  public addMessageHandler(handler: (message: WebSocketMessage) => void) {
    this.messageHandlers.push(handler);
  }

  public removeMessageHandler(handler: (message: WebSocketMessage) => void) {
    this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
  }

  // Send code update message
  sendCodeUpdate(code: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'code_update',
        data: { code },
      };
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  public disconnect() {
    console.log('Disconnecting WebSocket...');

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.ws) {
      this.ws.close(
        WEBSOCKET_CONSTANTS.CLOSE_CODES.NORMAL_CLOSURE,
        'User requested disconnect'
      );
      this.ws = null;
    }
  }

  // Send authentication message
  private sendAuthMessage(token: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const authMessage = {
        type: 'auth',
        data: { token },
      };
      this.ws.send(JSON.stringify(authMessage));
    }
  }
}

export const useWebSocket = (gameId: string) => {
  const [connected, setConnected] = useState(false);
  const wsClientRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    wsClientRef.current = new WebSocketClient(gameId);
    setConnected(true);

    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
      }
    };
  }, [gameId]);

  const sendCodeUpdate = useCallback((code: string) => {
    if (wsClientRef.current) {
      wsClientRef.current.sendCodeUpdate(code);
    }
  }, []);

  const addMessageHandler = useCallback(
    (handler: (message: WebSocketMessage) => void) => {
      if (wsClientRef.current) {
        wsClientRef.current.addMessageHandler(handler);
      }
    },
    []
  );

  const removeMessageHandler = useCallback(
    (handler: (message: WebSocketMessage) => void) => {
      if (wsClientRef.current) {
        wsClientRef.current.removeMessageHandler(handler);
      }
    },
    []
  );

  return {
    connected,
    sendCodeUpdate,
    addMessageHandler,
    removeMessageHandler,
  };
};

export default WebSocketClient;
