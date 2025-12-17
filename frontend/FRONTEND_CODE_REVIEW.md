# 프론트엔드 코드 구조 검토 리포트

## 📋 개요

프론트엔드 코드베이스의 구조적 문제점과 개선사항을 종합적으로 분석한 리포트입니다.

---

## 🔴 Critical Issues (즉시 수정 필요)

### 1. API 클라이언트 불일치 (axios vs fetch)

**문제점:**
- `lib/api.ts`: axios 사용
- `lib/problem-api.ts`: fetch 사용
- 두 가지 HTTP 클라이언트가 혼용되어 일관성 부족

**영향:**
- 에러 처리 방식 불일치
- 인터셉터 적용 불일치 (axios만 인터셉터 사용 가능)
- 인증 토큰 처리 방식 불일치
- 유지보수 어려움

**개선 방안:**
```typescript
// ✅ GOOD: 통일된 API 클라이언트 사용
// 모든 API 호출을 axios로 통일하거나, fetch 기반으로 통일
// problem-api.ts를 axios 기반으로 변경
```

**파일:**
- `lib/api.ts` (axios)
- `lib/problem-api.ts` (fetch)

---

### 2. 거대한 컴포넌트 파일

**문제점:**
- `components/admin/ProblemList.tsx`: **802줄**
- 단일 책임 원칙 위반
- 테스트 및 유지보수 어려움

**개선 방안:**
```typescript
// ✅ GOOD: 컴포넌트 분리
// ProblemList.tsx를 다음과 같이 분리:
// - ProblemList.tsx (메인 컴포넌트)
// - ProblemListHeader.tsx
// - ProblemListTable.tsx
// - ProblemListFilters.tsx
// - ProblemListPagination.tsx
// - hooks/useProblemList.ts (비즈니스 로직)
```

**파일:**
- `components/admin/ProblemList.tsx` (802줄)

---

## 🟡 High Priority Issues

### 3. 타입 정의 중복 가능성

**문제점:**
- `types/index.ts`에 많은 타입 정의
- `lib/types.ts` 존재
- `lib/leetcode-types.ts` 존재
- 타입 정의 위치가 분산되어 있음

**개선 방안:**
```typescript
// ✅ GOOD: 타입 정의 통합 및 명확한 구조
// types/
//   ├── index.ts (공통 타입)
//   ├── api.ts (API 관련 타입)
//   ├── game.ts (게임 관련 타입)
//   ├── problem.ts (문제 관련 타입)
//   └── user.ts (사용자 관련 타입)
```

**파일:**
- `types/index.ts`
- `lib/types.ts`
- `lib/leetcode-types.ts`

---

### 4. React Query 사용 패턴 불일치

**문제점:**
- 일부 hook에서만 React Query 사용 (`useGameData`, `useProblem`)
- 다른 곳에서는 직접 API 호출
- 캐싱 전략 불일치

**개선 방안:**
```typescript
// ✅ GOOD: 모든 데이터 fetching을 React Query로 통일
// hooks/
//   ├── useGameData.ts ✅ (이미 React Query 사용)
//   ├── useProblem.ts ✅ (이미 React Query 사용)
//   ├── useUser.ts (추가 필요)
//   ├── useProblems.ts (추가 필요)
//   └── useLeaderboard.ts (추가 필요)
```

**현재 상태:**
- React Query 사용: `useGameData`, `useProblem`
- 직접 API 호출: `pages/dashboard/index.tsx`, `pages/leaderboard.tsx`

---

### 5. 에러 처리 패턴 불일치

**문제점:**
- 일부는 `error-tracking.ts` 사용
- 일부는 직접 `console.error` 사용 (개발 환경 체크 후)
- 일부는 try-catch로만 처리

**개선 방안:**
```typescript
// ✅ GOOD: 통일된 에러 처리 훅 사용
// hooks/useErrorHandler.ts 생성
export const useErrorHandler = (component: string, action: string) => {
  return useCallback((error: unknown, context?: Record<string, unknown>) => {
    const handler = createErrorHandler(component, action);
    handler(error, context);
  }, [component, action]);
};
```

---

### 6. 상태 관리 패턴 혼재

**문제점:**
- Zustand: `authStore.ts` (전역 상태)
- React Query: 데이터 fetching
- useState: 로컬 상태
- useGameRoomState: 복잡한 커스텀 훅

**개선 방안:**
```typescript
// ✅ GOOD: 상태 관리 전략 명확화
// - 전역 상태: Zustand (인증, UI 설정)
// - 서버 상태: React Query (데이터 fetching)
// - 로컬 상태: useState (컴포넌트 내부)
// - 복잡한 로직: 커스텀 훅 (useGameRoomState 등)
```

---

## 🟢 Medium Priority Issues

### 7. 컴포넌트 Props 타입 정의 위치 불일치

**문제점:**
- 일부는 컴포넌트 파일 내부에 정의
- 일부는 별도 타입 파일에 정의
- 일관성 부족

**개선 방안:**
```typescript
// ✅ GOOD: Props 타입은 컴포넌트 파일 내부에 정의
// 단, 여러 컴포넌트에서 공유되는 경우 types/에 정의
```

---

### 8. 상수 정의 위치 분산

**문제점:**
- `constants/index.ts`: 전역 상수
- `components/game/constants/`: 게임 관련 상수
- `components/admin/constants/`: 관리자 관련 상수
- 일관성은 있으나, 일부 중복 가능성

**개선 방안:**
```typescript
// ✅ GOOD: 현재 구조 유지하되, 중복 제거
// constants/
//   ├── index.ts (전역 상수)
//   ├── game.ts (게임 관련)
//   └── admin.ts (관리자 관련)
```

---

### 9. WebSocket 클라이언트 중복

**문제점:**
- `lib/websocket.ts`: 게임룸 WebSocket
- `lib/matchmaking-websocket.ts`: 매칭 WebSocket
- 공통 로직 중복 가능성

**개선 방안:**
```typescript
// ✅ GOOD: 공통 WebSocket 로직 추출
// lib/websocket/
//   ├── base.ts (공통 WebSocket 클라이언트)
//   ├── game-room.ts (게임룸 전용)
//   └── matchmaking.ts (매칭 전용)
```

---

### 10. 로딩 상태 UI 컴포넌트 중복

**문제점:**
- `components/ui/Loading.tsx`
- `components/ui/LoadingScreen.tsx`
- `components/ui/Spinner.tsx`
- `components/ui/CodeRacerLoader.tsx`
- 기능 중복 가능성

**개선 방안:**
```typescript
// ✅ GOOD: 로딩 컴포넌트 통합
// components/ui/Loading.tsx (통합)
//   - size prop으로 크기 조절
//   - variant prop으로 스타일 변경
//   - fullScreen prop으로 전체 화면 모드
```

---

## 📊 통계

### 파일 크기 분석
- **최대 파일**: `ProblemList.tsx` (802줄)
- **평균 파일 크기**: ~150줄
- **30줄 초과 파일**: 약 60개

### 코드 중복
- API 클라이언트: 2개 (axios, fetch)
- WebSocket 클라이언트: 2개
- 로딩 컴포넌트: 4개
- 타입 정의 파일: 3개

### 아키텍처 패턴
- ✅ 컴포넌트 구조: 잘 분리됨
- ✅ 폴더 구조: 논리적으로 구성됨
- ⚠️ API 호출: 불일치
- ⚠️ 상태 관리: 혼재

---

## 🎯 우선순위별 개선 계획

### Phase 1: Critical (즉시)
1. ✅ API 클라이언트 통일 (axios로 통일)
2. ✅ ProblemList 컴포넌트 분리

### Phase 2: High Priority (1-2주)
3. 타입 정의 통합 및 구조화
4. React Query 사용 패턴 통일
5. 에러 처리 패턴 통일

### Phase 3: Medium Priority (1개월)
6. WebSocket 클라이언트 리팩토링
7. 로딩 컴포넌트 통합
8. 상수 정의 최적화

---

## 📝 권장사항

### 1. 코드 스타일 가이드 작성
- 컴포넌트 구조 가이드
- API 호출 패턴 가이드
- 에러 처리 가이드
- 타입 정의 가이드

### 2. 테스트 전략 수립
- 단위 테스트: hooks, utils
- 통합 테스트: API 호출
- E2E 테스트: 주요 플로우

### 3. 성능 최적화
- React.memo 사용 검토
- useMemo, useCallback 최적화
- 코드 스플리팅 검토

### 4. 문서화
- 컴포넌트 문서화
- API 문서화
- 아키텍처 문서화

---

## ✅ 잘된 점

1. **폴더 구조**: 논리적으로 잘 구성됨
2. **컴포넌트 분리**: 대부분 잘 분리됨
3. **타입 안정성**: TypeScript 적극 활용
4. **에러 추적**: error-tracking 시스템 구축
5. **상수 관리**: 중앙화된 상수 관리
6. **커스텀 훅**: 재사용 가능한 훅 구조

---

## 📚 참고 자료

- [React Query Best Practices](https://tanstack.com/query/latest/docs/react/guides/best-practices)
- [TypeScript Project Structure](https://www.typescriptlang.org/docs/handbook/declaration-files/library-structures.html)
- [React Component Patterns](https://reactpatterns.com/)

---

**생성일**: 2024-12-19
**검토 범위**: `frontend/src` 전체
**총 파일 수**: 130개 (TS/TSX)

