import { useState, useEffect, useRef, useCallback } from 'react';

// WebSocket related type definitions
export interface WebSocketMessage {
  type: string;
  game_id: string;
  user_id?: string;
  code?: string;
  winner_id?: string;
  payload?: unknown;
}

export interface CodeUpdateMessage extends WebSocketMessage {
  type: 'code_update';
  code: string;
}

// WebSocket connection management class
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: ((message: WebSocketMessage) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPingTime = 0;

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

    // Get JWT token
    const token =
      localStorage.getItem('authToken') || localStorage.getItem('token');

    if (!token) {
      console.error('No authentication token found');
      return;
    }

    // Add token as query parameter (headers cannot be set in browser WebSocket)
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
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
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
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

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
    }, 30000); // Ping every 30 seconds
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
      this.ws.close(1000, 'User requested disconnect');
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
