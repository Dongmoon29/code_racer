import { useState, useEffect, useRef, useCallback } from 'react';
import { WEBSOCKET_CONSTANTS } from '@/constants';
import { BaseWebSocketClient } from './websocket/base';

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

// WebSocket connection management class for game rooms
export class WebSocketClient extends BaseWebSocketClient {
  private messageHandlers: ((message: WebSocketMessage) => void)[] = [];
  private pingInterval: NodeJS.Timeout | null = null;
  private lastPingTime = 0;

  constructor(private gameId: string) {
    super(
      'WebSocketClient',
      WEBSOCKET_CONSTANTS.CONNECTION.MAX_RECONNECT_ATTEMPTS,
      WEBSOCKET_CONSTANTS.CONNECTION.RECONNECT_BASE_DELAY_MS,
      WEBSOCKET_CONSTANTS.CONNECTION.MAX_RECONNECT_DELAY_MS
    );
    this.connect();
  }

  private connect() {
    try {
      const wsUrl = this.buildWebSocketUrl(`/ws/${this.gameId}`);
      this.ws = new WebSocket(wsUrl);

      this.setupEventHandlers(
        () => {
          this.startPingInterval();
          const token = sessionStorage.getItem('authToken');
          if (token) {
            this.sendAuthMessage(token);
          }
        },
        (event) => {
          const messages = this.parseMessage<WebSocketMessage>(event.data as string);
          messages.forEach((message) => this.handleMessage(message));
        },
        () => {
          this.handleDisconnect();
        }
      );
    } catch (error) {
      this.errorHandler(error, {
        action: 'connect',
        gameId: this.gameId,
      });
    }
  }

  private handleDisconnect() {
    this.attemptReconnect(() => {
      this.connect();
    });
  }

  private startPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({ type: 'ping', timestamp: Date.now() });
        this.lastPingTime = Date.now();
      }
    }, WEBSOCKET_CONSTANTS.CONNECTION.PING_INTERVAL_MS);
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
    this.sendMessage({
      type: 'code_update',
      data: { code },
    });
  }

  public override disconnect(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    super.disconnect();
  }

  // Send authentication message
  private sendAuthMessage(token: string) {
    this.sendMessage({
      type: 'auth',
      data: { token },
    });
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
