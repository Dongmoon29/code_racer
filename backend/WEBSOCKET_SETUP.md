# WebSocket 연결 설정 가이드

## 개요

Code Racer 백엔드는 실시간 게임 통신을 위해 WebSocket을 사용합니다. 이 문서는 WebSocket 연결 설정과 운영환경에서 발생할 수 있는 문제들을 해결하는 방법을 설명합니다.

## WebSocket 엔드포인트

```
ws://your-backend-domain/ws/{gameId}
```

- **프로토콜**: `ws://` (HTTP) 또는 `wss://` (HTTPS)
- **경로**: `/ws/{gameId}` (게임 ID는 UUID 형식)
- **인증**: JWT 토큰 필요

## 인증 방법

WebSocket 연결 시 다음 2가지 방법 중 하나로 인증할 수 있습니다:

### 1. Authorization 헤더 (권장)

```javascript
// JavaScript 예제
const token = 'your_jwt_token_here';
const ws = new WebSocket(`wss://your-backend-domain/ws/${gameId}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### 2. 쿠리 파라미터 (fallback)

```javascript
// JavaScript 예제
const token = 'your_jwt_token_here';
const ws = new WebSocket(
  `wss://your-backend-domain/ws/${gameId}?token=${token}`
);
```

**참고**: 쿠키 기반 인증은 더 이상 지원되지 않습니다. 보안 및 도메인 간 호환성을 위해 Authorization 헤더 사용을 권장합니다.

## 클라이언트 구현 예제

### JavaScript (브라우저)

```javascript
class GameWebSocket {
  constructor(gameId, token) {
    this.gameId = gameId;
    this.token = token;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    try {
      // Authorization 헤더를 사용한 연결 (권장)
      this.ws = new WebSocket(`wss://your-backend-domain/ws/${this.gameId}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      this.handleReconnect();
    }
  }

  setupEventHandlers() {
    this.ws.onopen = () => {
      console.log('WebSocket 연결 성공');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('메시지 파싱 실패:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket 연결 종료:', event.code, event.reason);
      if (!event.wasClean) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket 에러:', error);
    };
  }

  handleMessage(data) {
    switch (data.type) {
      case 'player_joined':
        console.log('플레이어 참가:', data.data);
        break;
      case 'game_started':
        console.log('게임 시작:', data.data);
        break;
      case 'code_submitted':
        console.log('코드 제출:', data.data);
        break;
      case 'game_finished':
        console.log('게임 종료:', data.data);
        break;
      default:
        console.log('알 수 없는 메시지 타입:', data);
    }
  }

  sendMessage(type, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = { type, data };
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket이 연결되지 않음');
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      console.log(
        `${delay}ms 후 재연결 시도 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('최대 재연결 시도 횟수 초과');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, '사용자 요청');
    }
  }
}

// 사용 예제
const gameWs = new GameWebSocket('game-uuid-here', 'jwt-token-here');
gameWs.connect();

// 메시지 전송
gameWs.sendMessage('ready', { status: 'ready' });
```

### Python

```python
import websocket
import json
import time
import threading

class GameWebSocket:
    def __init__(self, game_id, token, backend_url):
        self.game_id = game_id
        self.token = token
        self.backend_url = backend_url
        self.ws = None
        self.reconnect_attempts = 0
        self.max_reconnect_attempts = 5

    def connect(self):
        try:
            # Authorization 헤더를 사용한 연결
            headers = {
                'Authorization': f'Bearer {self.token}'
            }

            url = f"{self.backend_url}/ws/{self.game_id}"
            self.ws = websocket.WebSocketApp(
                url,
                header=headers,
                on_open=self.on_open,
                on_message=self.on_message,
                on_error=self.on_error,
                on_close=self.on_close
            )

            # 별도 스레드에서 WebSocket 실행
            wst = threading.Thread(target=self.ws.run_forever)
            wst.daemon = True
            wst.start()

        except Exception as e:
            print(f'WebSocket 연결 실패: {e}')
            self.handle_reconnect()

    def on_open(self, ws):
        print('WebSocket 연결 성공')
        self.reconnect_attempts = 0

    def on_message(self, ws, message):
        try:
            data = json.loads(message)
            self.handle_message(data)
        except json.JSONDecodeError as e:
            print(f'메시지 파싱 실패: {e}')

    def on_error(self, ws, error):
        print(f'WebSocket 에러: {error}')

    def on_close(self, ws, close_status_code, close_msg):
        print(f'WebSocket 연결 종료: {close_status_code} - {close_msg}')
        if close_status_code != 1000:  # 정상 종료가 아닌 경우
            self.handle_reconnect()

    def handle_message(self, data):
        message_type = data.get('type')
        message_data = data.get('data', {})

        if message_type == 'player_joined':
            print(f'플레이어 참가: {message_data}')
        elif message_type == 'game_started':
            print(f'게임 시작: {message_data}')
        elif message_type == 'code_submitted':
            print(f'코드 제출: {message_data}')
        elif message_type == 'game_finished':
            print(f'게임 종료: {message_data}')
        else:
            print(f'알 수 없는 메시지 타입: {data}')

    def send_message(self, message_type, data):
        if self.ws and self.ws.sock and self.ws.sock.connected:
            message = {'type': message_type, 'data': data}
            self.ws.send(json.dumps(message))
        else:
            print('WebSocket이 연결되지 않음')

    def handle_reconnect(self):
        if self.reconnect_attempts < self.max_reconnect_attempts:
            self.reconnect_attempts += 1
            delay = min(1000 * (2 ** self.reconnect_attempts), 30000)

            print(f'{delay}ms 후 재연결 시도 ({self.reconnect_attempts}/{self.max_reconnect_attempts})')

            time.sleep(delay / 1000)
            self.connect()
        else:
            print('최대 재연결 시도 횟수 초과')

    def disconnect(self):
        if self.ws:
            self.ws.close(1000, '사용자 요청')

# 사용 예제
if __name__ == "__main__":
    game_ws = GameWebSocket(
        game_id='game-uuid-here',
        token='jwt-token-here',
        backend_url='wss://your-backend-domain'
    )

    game_ws.connect()

    # 메시지 전송
    game_ws.send_message('ready', {'status': 'ready'})

    # 연결 유지
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        game_ws.disconnect()
```

## 운영환경 설정

### 환경 변수

운영환경에서 다음 환경 변수를 설정하세요:

```bash
# 프론트엔드 도메인
FRONTEND_URL=https://yourdomain.com

# CORS 허용 오리진 (쉼표로 구분)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# 환경 설정
ENVIRONMENT=production
```

### Nginx 설정 (프록시 사용 시)

```nginx
# WebSocket 프록시 설정
location /ws/ {
    proxy_pass http://backend:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket 연결 유지
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}
```

## 문제 해결

### 1. 연결 실패

**증상**: WebSocket 연결이 실패함

**해결 방법**:

1. 백엔드 서버가 실행 중인지 확인
2. 방화벽 설정 확인
3. CORS 설정 확인
4. 인증 토큰 유효성 확인

### 2. 인증 실패

**증상**: "Authentication required" 에러

**해결 방법**:

1. JWT 토큰이 유효한지 확인
2. 토큰이 올바른 형식으로 전송되는지 확인
3. Authorization 헤더 사용 권장

### 3. CORS 오류

**증상**: 브라우저에서 CORS 오류 발생

**해결 방법**:

1. `CORS_ALLOWED_ORIGINS` 환경 변수에 프론트엔드 도메인 추가
2. `FRONTEND_URL` 환경 변수 설정
3. 백엔드 서버 재시작

### 4. 연결 끊김

**증상**: WebSocket 연결이 자주 끊어짐

**해결 방법**:

1. 네트워크 연결 상태 확인
2. 프록시 타임아웃 설정 확인
3. 자동 재연결 로직 구현

## 디버깅

### 로그 확인

백엔드 로그에서 WebSocket 관련 메시지를 확인하세요:

```bash
# 백엔드 로그 확인
docker logs your-backend-container

# 또는 로컬 실행 시
tail -f logs/app.log
```

### 브라우저 개발자 도구

1. **Network 탭**: WebSocket 연결 상태 확인
2. **Console 탭**: 에러 메시지 및 로그 확인
3. **Application 탭**: 쿠키 및 로컬 스토리지 확인

### WebSocket 테스트 도구

- **wscat**: 커맨드 라인 WebSocket 클라이언트
- **Postman**: WebSocket 지원
- **브라우저 확장 프로그램**: WebSocket 테스터

## 성능 최적화

### 1. 연결 풀링

```javascript
// 연결 풀 관리
class WebSocketPool {
  constructor(maxConnections = 5) {
    this.connections = new Map();
    this.maxConnections = maxConnections;
  }

  getConnection(gameId, token) {
    if (this.connections.has(gameId)) {
      const conn = this.connections.get(gameId);
      if (conn.readyState === WebSocket.OPEN) {
        return conn;
      }
    }

    if (this.connections.size >= this.maxConnections) {
      // 가장 오래된 연결 제거
      const oldestKey = this.connections.keys().next().value;
      this.connections.delete(oldestKey);
    }

    const conn = new GameWebSocket(gameId, token);
    this.connections.set(gameId, conn);
    return conn;
  }
}
```

### 2. 메시지 배치 처리

```javascript
// 메시지 배치 전송
class MessageBatcher {
  constructor(ws, batchSize = 10, batchDelay = 100) {
    this.ws = ws;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
    this.messages = [];
    this.timer = null;
  }

  addMessage(type, data) {
    this.messages.push({ type, data });

    if (this.messages.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.batchDelay);
    }
  }

  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.messages.length > 0) {
      this.ws.send(
        JSON.stringify({
          type: 'batch',
          data: this.messages,
        })
      );
      this.messages = [];
    }
  }
}
```

## 보안 고려사항

1. **HTTPS/WSS 사용**: 운영환경에서는 반드시 암호화된 연결 사용
2. **토큰 만료**: JWT 토큰의 적절한 만료 시간 설정
3. **오리진 검증**: 허용된 도메인에서만 연결 허용
4. **속도 제한**: WebSocket 연결 및 메시지 전송 속도 제한 구현

## 모니터링

### 연결 상태 모니터링

```javascript
// 연결 상태 모니터링
setInterval(() => {
  if (gameWs.ws && gameWs.ws.readyState === WebSocket.OPEN) {
    // 연결 상태 확인
    gameWs.sendMessage('ping', { timestamp: Date.now() });
  }
}, 30000); // 30초마다
```

### 메트릭 수집

```javascript
// 연결 메트릭 수집
class WebSocketMetrics {
  constructor() {
    this.connectionCount = 0;
    this.messageCount = 0;
    this.errorCount = 0;
  }

  recordConnection() {
    this.connectionCount++;
  }

  recordMessage() {
    this.messageCount++;
  }

  recordError() {
    this.errorCount++;
  }

  getMetrics() {
    return {
      connectionCount: this.connectionCount,
      messageCount: this.messageCount,
      errorCount: this.errorCount,
    };
  }
}
```

이 문서를 참고하여 WebSocket 연결 문제를 해결하고 안정적인 실시간 게임 통신을 구현하세요.
