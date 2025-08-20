import { useState, useEffect, useRef, useCallback } from 'react';

// WebSocket 관련 타입 정의
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

// WebSocket 연결 관리 클래스
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
    // WebSocket URL 구성
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

    // 프로덕션 환경에서는 현재 도메인 사용, 개발환경에서는 localhost 사용
    let wsHost: string;
    if (process.env.NODE_ENV === 'production') {
      // 프로덕션: 현재 도메인 사용
      wsHost = window.location.host;
    } else {
      // 개발환경: 환경변수 또는 기본값 사용
      wsHost =
        process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
        'http://localhost:8080';
      wsHost = wsHost.replace(/^https?:\/\//, '');
    }

    // JWT 토큰 가져오기
    const token =
      localStorage.getItem('authToken') || localStorage.getItem('token');

    if (!token) {
      console.error('No authentication token found');
      return;
    }

    // 토큰을 쿼리 파라미터로 추가 (브라우저 WebSocket에서는 헤더 설정 불가)
    const wsUrl = `${wsProtocol}//${wsHost}/ws/${
      this.gameId
    }?token=${encodeURIComponent(token)}`;

    console.log('=============WebSocket Connection============');
    console.log(`Game ID: ${this.gameId}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Protocol: ${wsProtocol}`);
    console.log(`Host: ${wsHost}`);
    console.log(`WebSocket URL: ${wsUrl}`);
    console.log(`Token: ${token.substring(0, 20)}...`);

    // WebSocket 연결 생성
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected successfully');
      this.reconnectAttempts = 0;
      this.startPingInterval();

      // 연결 후 인증 메시지 전송 (선택사항)
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

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
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

      console.log(
        `WebSocket disconnected. Attempting to reconnect in ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      this.reconnectTimeout = setTimeout(() => {
        console.log('Attempting to reconnect...');
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
        // ping 메시지 전송 (브라우저 WebSocket에서는 ping 메서드가 지원되지 않음)
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        this.lastPingTime = Date.now();
      }
    }, 30000); // 30초마다 ping
  }

  private handleMessage(message: WebSocketMessage) {
    if (message.type === 'pong') {
      const latency = Date.now() - this.lastPingTime;
      console.log(`WebSocket latency: ${latency}ms`);
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

  // 코드 업데이트 메시지 전송
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

  // 인증 메시지 전송
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
