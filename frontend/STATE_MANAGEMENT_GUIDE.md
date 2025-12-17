# 상태 관리 전략 가이드

## 📋 개요

CodeRacer 프론트엔드의 상태 관리 전략을 명확히 정의한 가이드입니다.

---

## 🎯 상태 관리 전략

### 1. 전역 상태 (Global State)

**도구**: Zustand

**사용 사례:**
- 인증 상태 (사용자 정보, 로그인 상태)
- UI 설정 (테마, 사이드바 상태 등)
- 앱 전반에 걸쳐 공유되는 상태

**예시:**
```typescript
// stores/authStore.ts
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  login: (user: User) => set({ user, isLoggedIn: true }),
  logout: async () => { /* ... */ },
}));
```

**파일 위치:**
- `stores/authStore.ts` - 인증 상태

---

### 2. 서버 상태 (Server State)

**도구**: React Query (@tanstack/react-query)

**사용 사례:**
- API에서 가져온 데이터
- 캐싱이 필요한 데이터
- 자동 리프레시가 필요한 데이터

**예시:**
```typescript
// hooks/useGameData.ts
export const useGameData = ({ matchId }: UseGameDataProps) => {
  return useQuery({
    queryKey: ['game', matchId],
    queryFn: () => matchApi.getGame(matchId),
    staleTime: 5 * 60 * 1000,
  });
};
```

**파일 위치:**
- `hooks/useGameData.ts` - 게임 데이터
- `hooks/useProblem.ts` - 문제 데이터
- `pages/dashboard/index.tsx` - 사용자 데이터
- `pages/leaderboard.tsx` - 리더보드 데이터

**장점:**
- 자동 캐싱
- 백그라운드 리프레시
- 에러 재시도
- 로딩 상태 관리

---

### 3. 로컬 상태 (Local State)

**도구**: React useState, useReducer

**사용 사례:**
- 컴포넌트 내부에서만 사용되는 상태
- 폼 입력 값
- UI 토글 상태 (모달 열림/닫힘)
- 임시 계산 값

**예시:**
```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [searchTerm, setSearchTerm] = useState('');
```

**원칙:**
- 가능한 한 로컬 상태로 시작
- 다른 컴포넌트에서 필요해지면 상위로 끌어올리기
- 여러 컴포넌트에서 공유되면 전역 상태로 이동

---

### 4. 복잡한 로직 상태 (Complex Logic State)

**도구**: 커스텀 훅 (Custom Hooks)

**사용 사례:**
- 여러 상태를 조합한 복잡한 로직
- WebSocket 연결 관리
- 게임 룸 상태 관리
- 세션 스토리지와 동기화

**예시:**
```typescript
// hooks/useGameRoomState.ts
export const useGameRoomState = ({ matchId }: Props) => {
  const [myCode, setMyCode] = useState(/* ... */);
  const [opponentCode, setOpponentCode] = useState(/* ... */);
  // 복잡한 로직...
  return { myCode, setMyCode, /* ... */ };
};
```

**파일 위치:**
- `hooks/useGameRoomState.ts` - 게임 룸 상태
- `hooks/useMatchmaking.ts` - 매칭 상태
- `components/game/hooks/useGameRoomWebSocket.ts` - WebSocket 관리

---

## 📊 상태 관리 결정 트리

```
상태가 필요한가?
│
├─ 컴포넌트 내부에서만 사용?
│  └─ ✅ useState (로컬 상태)
│
├─ 여러 컴포넌트에서 공유?
│  ├─ 서버에서 가져온 데이터?
│  │  └─ ✅ React Query (서버 상태)
│  │
│  ├─ 인증/UI 설정?
│  │  └─ ✅ Zustand (전역 상태)
│  │
│  └─ 복잡한 로직?
│     └─ ✅ 커스텀 훅 (로직 상태)
│
└─ WebSocket/실시간 데이터?
   └─ ✅ 커스텀 훅 + WebSocket 클라이언트
```

---

## 🔄 상태 동기화

### 세션 스토리지 동기화

**사용 사례:**
- 게임 코드 (페이지 새로고침 시 복구)
- 선택된 언어
- 사용자 설정

**예시:**
```typescript
// hooks/useSessionStorage.ts
export const useSessionStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    // 초기값을 세션 스토리지에서 로드
  });
  
  const setValue = (value: T) => {
    setStoredValue(value);
    sessionStorage.setItem(key, JSON.stringify(value));
  };
  
  return [storedValue, setValue] as const;
};
```

---

## ⚠️ 주의사항

### 1. 상태 중복 방지

**BAD:**
```typescript
// ❌ 같은 데이터를 여러 곳에서 관리
const [user, setUser] = useState(null); // 컴포넌트 A
const { user } = useAuthStore(); // 컴포넌트 B
const { data: user } = useQuery(['user']); // 컴포넌트 C
```

**GOOD:**
```typescript
// ✅ 단일 소스에서 관리
const { user } = useAuthStore(); // 모든 컴포넌트에서 사용
```

### 2. 불필요한 전역 상태 피하기

**BAD:**
```typescript
// ❌ 로컬 상태를 전역으로 올림
const useModalStore = create((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
}));
```

**GOOD:**
```typescript
// ✅ 로컬 상태로 충분
const [isOpen, setIsOpen] = useState(false);
```

### 3. React Query 캐싱 전략

**권장 설정:**
```typescript
{
  staleTime: 5 * 60 * 1000, // 5분
  cacheTime: 10 * 60 * 1000, // 10분
  retry: 3,
  refetchOnWindowFocus: false, // 필요시만
}
```

---

## 📁 파일 구조

```
frontend/src/
├── stores/           # Zustand 전역 상태
│   └── authStore.ts
├── hooks/            # React Query + 커스텀 훅
│   ├── useGameData.ts
│   ├── useProblem.ts
│   └── useMatchmaking.ts
└── components/
    └── game/
        └── hooks/    # 컴포넌트별 커스텀 훅
            ├── useGameRoomState.ts
            └── useGameRoomWebSocket.ts
```

---

## 🎯 현재 구현 상태

### ✅ 잘 구현된 부분

1. **인증 상태**: Zustand로 잘 관리됨
2. **게임 데이터**: React Query로 잘 관리됨
3. **문제 데이터**: React Query로 잘 관리됨
4. **게임 룸 상태**: 커스텀 훅으로 잘 관리됨

### 🔄 개선 가능한 부분

1. **사용자 프로필**: React Query로 통일됨 ✅
2. **리더보드**: React Query로 통일됨 ✅
3. **에러 처리**: 통일된 훅 사용 ✅

---

## 📚 참고 자료

- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [React State Management Guide](https://react.dev/learn/managing-state)

---

**최종 업데이트**: 2024-12-19

