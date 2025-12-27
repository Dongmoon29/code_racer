import { useState, useEffect, useRef, useCallback } from 'react';
import { WEBSOCKET_CONSTANTS } from '@/constants';
import { BaseWebSocketClient } from './websocket/base';
import type { SubmissionStatusMessage, TestCaseDetailMessage } from '@/types/websocket';

// WebSocket 기본 메시지 구조
interface BaseWebSocketMessage {
  type: string;
  game_id?: string;
  match_id?: string;
  user_id?: string;
}

// 각 메시지 타입을 명시적으로 정의 (Discriminated Union)
export interface AuthMessage extends BaseWebSocketMessage {
  type: 'auth';
  data: { token: string };
}

export interface PingMessage extends BaseWebSocketMessage {
  type: 'ping';
  timestamp: number;
}

export interface PongMessage extends BaseWebSocketMessage {
  type: 'pong';
  timestamp?: number;
}

export interface CodeUpdateMessage extends BaseWebSocketMessage {
  type: 'code_update';
  code: string;
  data?: { code: string };
  user_id?: string;
}

export interface GameFinishedMessage extends BaseWebSocketMessage {
  type: 'game_finished';
  winner_id?: string;
  message?: string;
}

export interface ErrorMessage extends BaseWebSocketMessage {
  type: 'error' | 'judge0_timeout_error' | 'judge0_quota_error';
  message?: string;
  details?: string;
}

// Submission 관련 메시지는 types/websocket.ts에서 임포트
export interface SubmissionStartedMessage extends BaseWebSocketMessage {
  type: 'submission_started';
  data?: SubmissionStatusMessage;
  payload?: SubmissionStatusMessage;
}

export interface SubmissionCompletedMessage extends BaseWebSocketMessage {
  type: 'submission_completed';
  data?: SubmissionStatusMessage;
  payload?: SubmissionStatusMessage;
}

export interface SubmissionFailedMessage extends BaseWebSocketMessage {
  type: 'submission_failed';
  data?: SubmissionStatusMessage;
  payload?: SubmissionStatusMessage;
}

export interface TestCaseRunningMessage extends BaseWebSocketMessage {
  type: 'test_case_running';
  data?: TestCaseDetailMessage;
  payload?: TestCaseDetailMessage;
}

export interface TestCaseCompletedMessage extends BaseWebSocketMessage {
  type: 'test_case_completed';
  data?: TestCaseDetailMessage;
  payload?: TestCaseDetailMessage;
}

// Discriminated Union: 모든 가능한 WebSocket 메시지 타입
export type WebSocketMessage =
  | AuthMessage
  | PingMessage
  | PongMessage
  | CodeUpdateMessage
  | GameFinishedMessage
  | ErrorMessage
  | SubmissionStartedMessage
  | SubmissionCompletedMessage
  | SubmissionFailedMessage
  | TestCaseRunningMessage
  | TestCaseCompletedMessage;

// 타입 가드 함수들
export function isCodeUpdateMessage(msg: WebSocketMessage): msg is CodeUpdateMessage {
  return msg.type === 'code_update';
}

export function isGameFinishedMessage(msg: WebSocketMessage): msg is GameFinishedMessage {
  return msg.type === 'game_finished';
}

export function isErrorMessage(msg: WebSocketMessage): msg is ErrorMessage {
  return msg.type === 'error' || msg.type === 'judge0_timeout_error' || msg.type === 'judge0_quota_error';
}

export function isSubmissionStartedMessage(msg: WebSocketMessage): msg is SubmissionStartedMessage {
  return msg.type === 'submission_started';
}

export function isSubmissionCompletedMessage(msg: WebSocketMessage): msg is SubmissionCompletedMessage {
  return msg.type === 'submission_completed';
}

export function isSubmissionFailedMessage(msg: WebSocketMessage): msg is SubmissionFailedMessage {
  return msg.type === 'submission_failed';
}

export function isTestCaseRunningMessage(msg: WebSocketMessage): msg is TestCaseRunningMessage {
  return msg.type === 'test_case_running';
}

export function isTestCaseCompletedMessage(msg: WebSocketMessage): msg is TestCaseCompletedMessage {
  return msg.type === 'test_case_completed';
}

// 타입 안전한 메시지 unwrap 헬퍼 함수
export function unwrapSubmissionMessage(msg: SubmissionStartedMessage | SubmissionCompletedMessage | SubmissionFailedMessage): SubmissionStatusMessage {
  // data 또는 payload에서 추출, 없으면 msg 자체를 사용
  return (msg.data || msg.payload || msg) as SubmissionStatusMessage;
}

export function unwrapTestCaseMessage(msg: TestCaseRunningMessage | TestCaseCompletedMessage): TestCaseDetailMessage {
  return (msg.data || msg.payload || msg) as TestCaseDetailMessage;
}

// WebSocket connection management class for game rooms
export class WebSocketClient extends BaseWebSocketClient {
  private messageHandlers: ((message: WebSocketMessage) => void)[] = [];
  private pingInterval: NodeJS.Timeout | null = null;

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
      const wsUrl = this.buildWebSocketUrl(this.gameId);
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
          const messages = this.parseMessage<WebSocketMessage>(
            event.data as string
          );
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
