import { WebSocketMessageType } from './constants';

// WebSocket 관련 타입 정의
export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

export interface CodeUpdateMessage extends WebSocketMessage {
  type: 'code_update';
  game_id: string;
  user_id: string;
  code: string;
}

export interface GameStartMessage extends WebSocketMessage {
  type: 'game_start';
  game_id: string;
}

export interface GameEndMessage extends WebSocketMessage {
  type: 'game_end';
  game_id: string;
  winner_id: string;
}

// WebSocket 연결 관리 클래스
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private gameId: string;
  private messageHandlers: ((message: WebSocketMessage) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(gameId: string) {
    this.gameId = gameId;
  }

  // WebSocket 연결 시작
  connect(): void {
    if (this.ws) {
      this.disconnect();
    }

    // /ws/ 경로가 중복되지 않도록 수정
    const wsUrl = `/${this.gameId}`; // URL 패턴을 백엔드와 일치시킴
    const wsBaseUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      window.location.origin.replace('http', 'ws');
    const fullUrl = `${wsBaseUrl}${wsUrl}`;

    console.log('Attempting WebSocket connection to:', fullUrl);

    try {
      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.handleOpen();
      };

      this.ws.onmessage = (event) => {
        console.log('📩 WebSocket message received:', event.data);
        this.handleMessage(event);
      };

      this.ws.onclose = (event) => {
        console.log('❌ WebSocket closed:', event.code, event.reason);
        this.handleClose(event);
      };

      this.ws.onerror = (event) => {
        console.error('⚠️ WebSocket error:', event);
        this.handleError(event);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }

  // WebSocket 연결 종료
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.reconnectAttempts = 0;
  }

  // 메시지 핸들러 등록
  addMessageHandler(handler: (message: WebSocketMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  // 메시지 핸들러 제거
  removeMessageHandler(handler: (message: WebSocketMessage) => void): void {
    this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
  }

  // 메시지 전송
  sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  // 코드 업데이트 메시지 전송
  sendCodeUpdate(code: string): void {
    this.sendMessage({
      type: WebSocketMessageType.CODE_UPDATE,
      game_id: this.gameId,
      code,
    });
  }

  // WebSocket 이벤트 핸들러
  private handleOpen(): void {
    console.log('WebSocket connection established');
    this.reconnectAttempts = 0;
  }

  private handleMessage(event: MessageEvent): void {
    try {
      // 메시지를 줄바꿈으로 분리하여 각각 처리
      const messages = event.data
        .split('\n')
        .filter((msg: string) => msg.trim());
      messages.forEach((msgStr: string) => {
        try {
          const message = JSON.parse(msgStr) as WebSocketMessage;
          this.messageHandlers.forEach((handler) => handler(message));
        } catch (innerError) {
          console.error(
            'Error processing individual message:',
            msgStr,
            innerError
          );
        }
      });
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      console.error('Raw message that caused error:', event.data);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket connection closed:', event.code, event.reason);

    // 정상 종료가 아닌 경우에만 재연결 시도
    if (!event.wasClean) {
      this.scheduleReconnect();
    }
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum reconnect attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(
      `Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect...');
      this.connect();
    }, delay);
  }
}

export default WebSocketClient;
