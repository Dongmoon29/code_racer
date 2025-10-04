# 매치메이킹 프로세스 플로우

## 전체 아키텍처

```mermaid
graph TB
    subgraph "Frontend"
        UI[사용자 인터페이스]
        Hook[useMatchmaking Hook]
        WSClient[MatchmakingWebSocketClient]
    end

    subgraph "Backend"
        WSController[WebSocketController]
        WSService[WebSocketService]
        Hub[Hub - 중앙 관리자]
        MMService[MatchmakingService]
        MatchService[MatchService]
        Redis[(Redis Cache)]
        DB[(PostgreSQL)]
    end

    UI -->|난이도 선택| Hook
    Hook -->|startMatching| WSClient
    WSClient -->|WebSocket 연결| WSController
    WSController -->|HandleConnection| WSService
    WSService -->|Client 등록| Hub
    Hub -->|매치 생성| MMService
    MMService -->|CreateMatch| MatchService
    MatchService -->|문제 조회/저장| DB
    MatchService -->|캐시 저장| Redis
    Hub -->|매치 결과 알림| WSService
    WSService -->|match_found| WSClient
    WSClient -->|콜백 실행| Hook
    Hook -->|리다이렉트| UI
```

## 상세 플로우

### 1. 매치메이킹 시작

```mermaid
sequenceDiagram
    actor User
    participant UI as 프론트엔드 UI
    participant Hook as useMatchmaking
    participant WSClient as WebSocket Client
    participant Backend as Backend Server

    User->>UI: 난이도 선택 (Easy/Medium/Hard)
    UI->>Hook: startMatching(difficulty)
    Hook->>Hook: 상태를 CONNECTING으로 변경
    Hook->>WSClient: new MatchmakingWebSocketClient()
    WSClient->>Backend: WebSocket 연결 요청 (/ws/matching)
    Backend-->>WSClient: 연결 성공
    WSClient->>Hook: onConnect 콜백
    Hook->>Hook: 상태를 SEARCHING으로 변경
    WSClient->>Backend: start_matching 메시지 전송
```

### 2. 백엔드 매칭 처리

```mermaid
sequenceDiagram
    participant Client as WebSocket Client
    participant Hub as Hub
    participant Queue as Matching Queue
    participant MMService as MatchmakingService
    participant MatchService as MatchService
    participant DB as Database
    participant Redis as Redis

    Client->>Hub: start_matching 메시지
    Hub->>Hub: handleStartMatching()
    Hub->>Queue: 사용자를 난이도별 큐에 추가
    Hub->>Client: matching_status (searching)

    alt 큐에 2명 이상 대기 중
        Hub->>Hub: tryMatchmaking()
        Hub->>Queue: 첫 2명 추출 (FIFO)
        Hub->>MMService: CreateMatch(player1, player2, difficulty)
        MMService->>MatchService: CreateMatch()
        MatchService->>DB: 난이도별 랜덤 문제 조회
        MatchService->>DB: Match 레코드 생성
        MatchService->>Redis: 게임 상태 및 플레이어 코드 초기화
        MatchService-->>MMService: Match 객체 반환
        MMService-->>Hub: Match 정보
        Hub->>Client: match_found 메시지 (양쪽 플레이어에게)
    else 큐에 혼자만 있음
        Hub->>Client: 대기 상태 유지
    end
```

### 3. 매치 성공 후 처리

```mermaid
sequenceDiagram
    participant Backend as Backend
    participant WSClient as WebSocket Client
    participant Hook as useMatchmaking
    participant Router as Next Router
    participant GameWS as Game WebSocket

    Backend->>WSClient: match_found 메시지
    WSClient->>WSClient: disconnectAfterMatch()
    WSClient->>Hook: onMatchFound 콜백
    Hook->>Hook: 상태를 FOUND로 변경
    Hook->>Hook: 1.5초 지연 타이머 설정
    Note over Hook: redirectDelayMs 동안 대기
    Hook->>Router: router.push(`/game/${gameId}`)
    Router->>GameWS: 게임용 WebSocket 연결 (/ws/:matchId)
```

### 4. 상태 관리

```mermaid
stateDiagram-v2
    [*] --> IDLE: 초기 상태
    IDLE --> CONNECTING: startMatching() 호출
    CONNECTING --> SEARCHING: WebSocket 연결 성공
    SEARCHING --> FOUND: 매치 성공
    SEARCHING --> ERROR: 연결 실패
    SEARCHING --> IDLE: cancelMatching() 호출
    ERROR --> IDLE: retryMatching() 호출
    FOUND --> [*]: 게임 페이지로 이동

    note right of SEARCHING
        - 매칭 큐에서 대기
        - 정기적으로 상태 업데이트
    end note

    note right of FOUND
        - 1.5초 후 자동 리다이렉트
        - WebSocket 정리
    end note
```

### 5. 매칭 취소 플로우

```mermaid
sequenceDiagram
    actor User
    participant Hook as useMatchmaking
    participant WSClient as WebSocket Client
    participant Hub as Backend Hub
    participant Queue as Matching Queue

    User->>Hook: cancelMatching() 호출
    Hook->>WSClient: cancelMatching()
    WSClient->>Hub: cancel_matching 메시지
    Hub->>Hub: handleCancelMatching()
    Hub->>Queue: 큐에서 사용자 제거
    Hub->>WSClient: matching_status (cancelled)
    Hook->>WSClient: disconnect()
    Hook->>Hook: 상태를 IDLE로 변경
```

## 주요 컴포넌트 설명

### Frontend

1. **useMatchmaking Hook** (`/frontend/src/hooks/useMatchmaking.ts`)
   - 매칭 상태 관리 (IDLE, CONNECTING, SEARCHING, FOUND, ERROR)
   - WebSocket 클라이언트 생성 및 관리
   - 자동 정리 (라우트 변경, 탭 종료, 백그라운드 전환 시)

2. **MatchmakingWebSocketClient** (`/frontend/src/lib/matchmaking-websocket.ts`)
   - 매칭 전용 WebSocket 연결 관리
   - 재연결 로직 (최대 3회, 지수 백오프)
   - 메시지 송수신 처리

### Backend

1. **WebSocketController** (`/backend/internal/controller/websocket_controller.go`)
   - WebSocket 연결 요청 처리
   - JWT 인증 검증
   - 매칭용 특수 UUID 할당 (00000000-0000-0000-0000-000000000000)

2. **Hub** (`/backend/internal/service/websocket_service.go`)
   - 모든 WebSocket 클라이언트 중앙 관리
   - 난이도별 매칭 큐 관리 (`matchingClients map[string][]*Client`)
   - FIFO 방식 매칭 (큐의 첫 2명)
   - 메시지 브로드캐스팅

3. **MatchmakingService** (`/backend/internal/service/matchmaking_service.go`)
   - 매치 생성 조율
   - MatchService에 위임

4. **MatchService** (`/backend/internal/service/match_service.go`)
   - 난이도별 랜덤 문제 선택
   - Match 레코드 DB 저장
   - Redis에 게임 상태 및 플레이어 코드 초기화

## 데이터 구조

### Redis 키 구조
```
match:{matchID}                              # 게임 상태
match:{matchID}:user:{userID}:code          # 플레이어 코드
match:{matchID}:users                        # 게임 참가자 Set
match:{matchID}:winner_lock                  # 승자 결정 분산 락
```

### WebSocket 메시지 타입
```typescript
// 클라이언트 → 서버
- start_matching: { type, difficulty }
- cancel_matching: { type }

// 서버 → 클라이언트
- matching_status: { type, status, queue_position?, wait_time_seconds? }
- match_found: { type, game_id, problem, opponent }
```

## 에러 처리 및 엣지 케이스

1. **연결 실패**: 최대 3회 재연결 시도 (지수 백오프)
2. **동시 제출**: Redis 분산 락으로 승자 결정
3. **중복 큐 등록**: 기존 항목 제거 후 재등록
4. **매치 후 연결 해제**: `disconnectAfterMatch` 플래그로 큐 정리 방지
5. **자동 정리**: 라우트 변경, 탭 종료, 백그라운드 전환 시 자동 취소
