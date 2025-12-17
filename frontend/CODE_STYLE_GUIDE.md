# Frontend Code Style Guide

이 문서는 CodeRacer 프론트엔드 프로젝트의 코드 스타일 가이드를 정의합니다.

## 📋 목차

1. [컴포넌트 구조](#컴포넌트-구조)
2. [API 호출 패턴](#api-호출-패턴)
3. [에러 처리 가이드](#에러-처리-가이드)
4. [타입 정의 가이드](#타입-정의-가이드)
5. [상태 관리 가이드](#상태-관리-가이드)
6. [WebSocket 사용 가이드](#websocket-사용-가이드)

---

## 컴포넌트 구조

### 기본 구조

```typescript
// ✅ GOOD: 명확한 구조와 타입 정의
interface ComponentProps {
  title: string;
  onAction?: () => void;
}

export const Component: FC<ComponentProps> = ({ title, onAction }) => {
  // 1. Hooks
  const [state, setState] = useState();
  const { data } = useQuery();

  // 2. Memoized values
  const memoizedValue = useMemo(() => {
    return computeValue();
  }, [dependencies]);

  // 3. Event handlers
  const handleClick = useCallback(() => {
    // handler logic
  }, [dependencies]);

  // 4. Effects
  useEffect(() => {
    // effect logic
  }, [dependencies]);

  // 5. Render
  return <div>{/* JSX */}</div>;
};
```

### 컴포넌트 분리 원칙

- **단일 책임 원칙**: 각 컴포넌트는 하나의 명확한 책임만 가져야 합니다
- **크기 제한**: 컴포넌트는 200줄 이하로 유지 (복잡한 경우 하위 컴포넌트로 분리)
- **재사용성**: 공통 로직은 커스텀 훅으로 추출

### 예시: 큰 컴포넌트 분리

```typescript
// ❌ BAD: 거대한 컴포넌트 (800줄)
export default function ProblemList() {
  // 모든 로직이 한 곳에...
}

// ✅ GOOD: 작은 컴포넌트로 분리
export default function ProblemList() {
  return (
    <>
      <ProblemListHeader />
      <ProblemListFilters />
      <ProblemListTable />
      <ProblemListStats />
    </>
  );
}
```

---

## API 호출 패턴

### 통일된 API 클라이언트 사용

```typescript
// ✅ GOOD: axios 기반 통일된 API 클라이언트
import { api } from '@/lib/api';

const response = await api.get('/endpoint');
const data = response.data;
```

### React Query 사용

```typescript
// ✅ GOOD: React Query를 통한 데이터 fetching
import { useQuery, useMutation } from '@tanstack/react-query';
import { problemApi } from '@/lib/api';

export const useProblem = (id: string) => {
  return useQuery({
    queryKey: ['problem', id],
    queryFn: () => problemApi.get(id),
    enabled: !!id,
  });
};
```

### 에러 처리

```typescript
// ✅ GOOD: React Query의 에러 처리 활용
const { data, error, isLoading } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  onError: (error) => {
    // 에러는 React Query가 자동으로 처리
    // 필요시 추가 처리
  },
});
```

---

## 에러 처리 가이드

### useErrorHandler 훅 사용

```typescript
// ✅ GOOD: 통일된 에러 처리
import { useErrorHandler } from '@/hooks/useErrorHandler';

const MyComponent = () => {
  const handleError = useErrorHandler('MyComponent', 'action_name');

  const handleAction = async () => {
    try {
      await someAction();
    } catch (error) {
      handleError(error, { additionalContext: 'value' });
    }
  };
};
```

### ErrorTracker 직접 사용

```typescript
// ✅ GOOD: 직접 ErrorTracker 사용 (필요한 경우)
import { ErrorTracker } from '@/lib/error-tracking';

ErrorTracker.getInstance().trackError(error, {
  component: 'ComponentName',
  action: 'action_name',
});
```

### 개발 환경 로깅

```typescript
// ✅ GOOD: 개발 환경에서만 로깅
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// ❌ BAD: 프로덕션에서도 로깅
console.log('Debug info:', data);
```

---

## 타입 정의 가이드

### 타입 정의 위치

```typescript
// ✅ GOOD: 중앙화된 타입 정의
// types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

// 컴포넌트에서 사용
import { User } from '@/types';
```

### Props 타입 정의

```typescript
// ✅ GOOD: 컴포넌트 파일 내부에 Props 타입 정의
interface ComponentProps {
  title: string;
  onAction?: () => void;
}

export const Component: FC<ComponentProps> = ({ title, onAction }) => {
  // ...
};
```

### 공유되는 타입

```typescript
// ✅ GOOD: 여러 컴포넌트에서 사용되는 타입은 types/에 정의
// types/index.ts
export interface GameState {
  status: 'waiting' | 'playing' | 'finished';
  // ...
}
```

### any 타입 피하기

```typescript
// ❌ BAD: any 타입 사용
const handleData = (data: any) => {
  // ...
};

// ✅ GOOD: 명시적 타입 정의
interface DataType {
  id: string;
  value: number;
}

const handleData = (data: DataType) => {
  // ...
};

// ✅ GOOD: unknown 타입 사용 (타입을 모를 때)
const handleData = (data: unknown) => {
  if (typeof data === 'object' && data !== null) {
    // 타입 가드 사용
  }
};
```

---

## 상태 관리 가이드

### 상태 관리 전략

```typescript
// ✅ GOOD: 상태 관리 전략 명확화

// 1. 전역 상태: Zustand (인증, UI 설정)
import { useAuthStore } from '@/stores/authStore';
const { user, isLoggedIn } = useAuthStore();

// 2. 서버 상태: React Query (데이터 fetching)
import { useQuery } from '@tanstack/react-query';
const { data } = useQuery({ queryKey: ['data'], queryFn: fetchData });

// 3. 로컬 상태: useState (컴포넌트 내부)
const [localState, setLocalState] = useState();

// 4. 복잡한 로직: 커스텀 훅
const { state, actions } = useGameRoomState();
```

### 상태 관리 선택 기준

| 상태 유형 | 사용 도구 | 예시 |
|---------|---------|------|
| 인증 정보 | Zustand | `useAuthStore` |
| UI 설정 | Zustand | 테마, 사이드바 상태 |
| 서버 데이터 | React Query | 문제 목록, 게임 데이터 |
| 폼 상태 | useState | 입력 필드 값 |
| 복잡한 로직 | 커스텀 훅 | `useGameRoomState` |

---

## WebSocket 사용 가이드

### WebSocket 클라이언트 선택

```typescript
// ✅ GOOD: 용도에 맞는 클라이언트 사용

// 1. 게임룸 WebSocket
import { WebSocketClient } from '@/lib/websocket';
const wsClient = new WebSocketClient(gameId);

// 2. 매칭 WebSocket
import { MatchmakingWebSocketClient } from '@/lib/matchmaking-websocket';
const wsClient = new MatchmakingWebSocketClient(callbacks);
```

### WebSocket 이벤트 처리

```typescript
// ✅ GOOD: 명확한 메시지 타입과 핸들러
wsClient.addMessageHandler((message: WebSocketMessage) => {
  switch (message.type) {
    case 'code_update':
      handleCodeUpdate(message);
      break;
    case 'game_finished':
      handleGameFinished(message);
      break;
    default:
      if (process.env.NODE_ENV === 'development') {
        console.log('Unknown message type:', message.type);
      }
  }
});
```

### WebSocket 정리

```typescript
// ✅ GOOD: 컴포넌트 언마운트 시 WebSocket 정리
useEffect(() => {
  const wsClient = new WebSocketClient(gameId);

  return () => {
    wsClient.disconnect();
  };
}, [gameId]);
```

---

## 상수 정의 가이드

### 상수 위치

```typescript
// ✅ GOOD: 중앙화된 상수 정의
// constants/index.ts
export const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'] as const;
export const DIFFICULTY_CONFIG = {
  Easy: { color: 'text-green-600', /* ... */ },
  // ...
} as const;
```

### 매직 넘버/문자열 피하기

```typescript
// ❌ BAD: 매직 넘버/문자열
if (status === 'playing') {
  // ...
}

// ✅ GOOD: 상수 사용
import { GAME_STATUS } from '@/constants';
if (status === GAME_STATUS.PLAYING) {
  // ...
}
```

---

## 성능 최적화 가이드

### React.memo 사용

```typescript
// ✅ GOOD: 불필요한 리렌더링 방지
export const ExpensiveComponent = memo(({ data }: Props) => {
  return <div>{/* ... */}</div>;
});
```

### useMemo와 useCallback

```typescript
// ✅ GOOD: 비용이 큰 계산 메모이제이션
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ✅ GOOD: 이벤트 핸들러 메모이제이션
const handleClick = useCallback(() => {
  // handler logic
}, [dependencies]);
```

---

## 파일 구조 가이드

### 폴더 구조

```
src/
├── components/        # 재사용 가능한 컴포넌트
│   ├── ui/           # 기본 UI 컴포넌트
│   ├── game/         # 게임 관련 컴포넌트
│   └── admin/        # 관리자 관련 컴포넌트
├── hooks/            # 커스텀 훅
├── lib/              # 유틸리티 및 라이브러리
├── stores/           # Zustand 스토어
├── types/            # TypeScript 타입 정의
├── constants/        # 상수 정의
└── pages/            # Next.js 페이지
```

---

## 네이밍 컨벤션

### 컴포넌트

```typescript
// ✅ GOOD: PascalCase
export const ProblemList = () => { /* ... */ };
export const GameRoom = () => { /* ... */ };
```

### 함수/변수

```typescript
// ✅ GOOD: camelCase
const handleSubmit = () => { /* ... */ };
const isLoading = true;
```

### 상수

```typescript
// ✅ GOOD: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';
```

### 타입/인터페이스

```typescript
// ✅ GOOD: PascalCase
interface UserProfile {
  id: string;
  name: string;
}

type Difficulty = 'Easy' | 'Medium' | 'Hard';
```

---

## 주석 가이드

### 영어 주석 사용

```typescript
// ✅ GOOD: 영어 주석
// Handle WebSocket message based on type
const handleMessage = (message: WebSocketMessage) => {
  // ...
};

// ❌ BAD: 한국어 주석
// 메시지 타입에 따라 처리
const handleMessage = (message: WebSocketMessage) => {
  // ...
};
```

### 복잡한 로직 설명

```typescript
// ✅ GOOD: 복잡한 로직에 대한 설명
// Exponential backoff: delay = baseDelay * 2^attempt
// Maximum delay is capped at maxDelay to prevent excessive wait times
const delay = Math.min(
  baseDelay * Math.pow(2, attempt),
  maxDelay
);
```

---

## 참고 자료

- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

---

**마지막 업데이트**: 2024-12-19

