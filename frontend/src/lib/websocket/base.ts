import { WEBSOCKET_CONSTANTS } from '@/constants';
import { createErrorHandler } from '@/lib/error-tracking';

/**
 * Base WebSocket client with common connection, reconnection, and error handling logic
 */
export abstract class BaseWebSocketClient {
  protected ws: WebSocket | null = null;
  protected reconnectAttempts = 0;
  protected reconnectTimeout: NodeJS.Timeout | null = null;
  protected isIntentionalDisconnect = false;
  protected errorHandler: ReturnType<typeof createErrorHandler>;
  protected maxReconnectAttempts: number;
  protected reconnectBaseDelay: number;
  protected maxReconnectDelay: number;

  constructor(
    protected clientName: string,
    maxReconnectAttempts: number,
    reconnectBaseDelay: number,
    maxReconnectDelay: number
  ) {
    this.maxReconnectAttempts = maxReconnectAttempts;
    this.reconnectBaseDelay = reconnectBaseDelay;
    this.maxReconnectDelay = maxReconnectDelay;
    this.errorHandler = createErrorHandler(clientName, 'websocket_operation');
  }

  /**
   * Build WebSocket URL with authentication token
   * @param path - WebSocket path without /ws prefix (e.g., gameId or 'matching')
   */
  protected buildWebSocketUrl(path: string): string {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    let wsUrl: string;
    if (process.env.NEXT_PUBLIC_WS_URL) {
      // If NEXT_PUBLIC_WS_URL is set, it should be the full base URL (e.g., ws://localhost:8080/ws)
      // We append the path to it
      const baseUrl = process.env.NEXT_PUBLIC_WS_URL.endsWith('/')
        ? process.env.NEXT_PUBLIC_WS_URL.slice(0, -1)
        : process.env.NEXT_PUBLIC_WS_URL;
      wsUrl = `${baseUrl}/${path}`;
    } else {
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
      wsUrl = `${wsProtocol}//${wsHost}/ws/${path}`;
    }

    // Add authentication token
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found for WebSocket connection');
    }

    return `${wsUrl}?token=${encodeURIComponent(token)}`;
  }

  /**
   * Setup WebSocket event handlers
   */
  protected setupEventHandlers(
    onOpen?: () => void,
    onMessage?: (event: MessageEvent) => void,
    onClose?: (event: CloseEvent) => void,
    onError?: (error: Event) => void
  ) {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      onOpen?.();
    };

    this.ws.onmessage = (event) => {
      onMessage?.(event);
    };

    this.ws.onclose = (event) => {
      onClose?.(event);
    };

    this.ws.onerror = (error) => {
      this.errorHandler(error, {
        action: 'websocket_error',
        event: 'onerror',
      });
      onError?.(error);
    };
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  protected attemptReconnect(connectFn?: () => void | Promise<void>) {
    if (this.isIntentionalDisconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.errorHandler(
        new Error(
          'Max reconnection attempts reached. WebSocket connection failed.'
        ),
        {
          action: 'attemptReconnect',
          reconnectAttempts: this.reconnectAttempts,
        }
      );
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `Attempting to reconnect ${this.clientName} (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`
      );
    }

    this.reconnectTimeout = setTimeout(() => {
      if (connectFn) {
        const result = connectFn();
        if (result instanceof Promise) {
          result.catch((error) => {
            this.errorHandler(error, {
              action: 'reconnect',
              reconnectAttempt: this.reconnectAttempts,
              delay,
            });
          });
        }
      }
    }, delay);
  }

  /**
   * Parse WebSocket message (handles newline-separated messages)
   */
  protected parseMessage<T>(data: string | Blob): T[] {
    const raw = typeof data === 'string' ? data : '';
    const chunks = raw.split('\n');

    const messages: T[] = [];
    for (const chunk of chunks) {
      const trimmed = chunk.trim();
      if (!trimmed) continue;

      try {
        const message = JSON.parse(trimmed) as T;
        messages.push(message);
      } catch (error) {
        this.errorHandler(error, {
          action: 'parse_message',
          messageData: raw,
          chunk: trimmed,
        });
      }
    }

    return messages;
  }

  /**
   * Send message through WebSocket
   */
  protected sendMessage(message: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.errorHandler(new Error('WebSocket is not connected'), {
        action: 'sendMessage',
      });
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Disconnect WebSocket
   */
  public disconnect(): void {
    this.isIntentionalDisconnect = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(
        WEBSOCKET_CONSTANTS.CLOSE_CODES.NORMAL_CLOSURE,
        'User requested disconnect'
      );
      this.ws = null;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`${this.clientName} disconnected`);
    }
  }

  /**
   * Cleanup resources
   */
  protected cleanup(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
