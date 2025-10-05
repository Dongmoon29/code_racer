# Router Helper Documentation

중앙 집중형 라우터 관리 시스템입니다. 하드코딩된 경로 문자열 대신 타입 안전하고 유지보수가 쉬운 라우팅을 제공합니다.

## 주요 기능

- 🎯 **중앙 집중형 라우트 관리**: 모든 경로를 한 곳에서 관리
- 🔒 **타입 안전성**: TypeScript로 타입 안전한 라우팅
- 🛡️ **라우트 검증**: 유효하지 않은 ID나 경로 검증
- 🚀 **편의 메서드**: 자주 사용하는 네비게이션을 위한 헬퍼 메서드
- 📝 **일관성**: 프로젝트 전체에서 일관된 라우팅 패턴

## 설치 및 사용

### 1. 기본 사용법

```tsx
import { useRouter } from 'next/router';
import { useRouterHelper } from '@/lib/router';

const MyComponent = () => {
  const router = useRouter();
  const routerHelper = useRouterHelper(router);

  const handleClick = () => {
    // 헬퍼 메서드 사용 (권장)
    routerHelper.goToDashboard();
    routerHelper.goToGameRoom('game-id');
    routerHelper.goToLogin();
  };

  return <button onClick={handleClick}>Navigate</button>;
};
```

### 2. 라우트 상수 사용

```tsx
import { ROUTES, useRouterHelper } from '@/lib/router';

const MyComponent = () => {
  const routerHelper = useRouterHelper(router);

  const handleClick = () => {
    // 라우트 상수 사용
    routerHelper.push(ROUTES.DASHBOARD);
    routerHelper.push(ROUTES.GAME_ROOM('game-id'));
    routerHelper.push(ROUTES.ADMIN_LEETCODE);
  };
};
```

### 3. 라우트 검증

```tsx
import { validateRoute, buildRoute } from '@/lib/router';

const MyComponent = () => {
  const handleGameNavigation = (gameId: string) => {
    // 라우트 검증
    if (validateRoute.gameId(gameId)) {
      routerHelper.goToGameRoom(gameId);
    } else {
      console.error('Invalid game ID');
    }
  };

  const handleLeetCodeNavigation = (id: string) => {
    try {
      const route = buildRoute.leetCodeDetail(id);
      routerHelper.push(route);
    } catch (error) {
      console.error('Invalid LeetCode ID:', error);
    }
  };
};
```

## API 레퍼런스

### RouterHelper 클래스

#### 네비게이션 메서드

```tsx
// 기본 네비게이션
routerHelper.push(path: string, options?: { shallow?: boolean })
routerHelper.replace(path: string, options?: { shallow?: boolean })
routerHelper.back()
routerHelper.reload()

// 특정 라우트 네비게이션
routerHelper.goToLogin()
routerHelper.goToRegister()
routerHelper.goToDashboard()
routerHelper.goToProfile()
routerHelper.goToGameRoom(gameId: string)
routerHelper.goToMatchmaking()
routerHelper.goToAdmin()
routerHelper.goToAdminLeetCode()
routerHelper.goToAdminUsers()

// 리다이렉트 (히스토리 없음)
routerHelper.replaceToLogin()
routerHelper.replaceToDashboard()
routerHelper.replaceToGameRoom(gameId: string)
```

#### 유틸리티 메서드

```tsx
// 현재 라우트 확인
routerHelper.isCurrentRoute(route: string): boolean
routerHelper.isCurrentRoutePattern(pattern: string): boolean
routerHelper.getCurrentRoute(): string
routerHelper.getQuery(): Record<string, string | string[] | undefined>
routerHelper.getQueryParam(key: string): string | string[] | undefined

// 라우트 검증
routerHelper.isValidGameId(gameId: string): boolean
routerHelper.isValidLeetCodeId(id: string): boolean
```

### ROUTES 상수

```tsx
export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  AUTH_CALLBACK: '/auth/callback',

  // Main app routes
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',

  // Game routes
  GAME_ROOM: (gameId: string) => `/game/${gameId}`,
  MATCHMAKING: '/matchmaking',

  // Admin routes
  ADMIN: '/admin',
  ADMIN_LEETCODE: '/admin/leetcode',
  ADMIN_USERS: '/admin/users',

  // API routes
  API: {
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      EXCHANGE_TOKEN: '/api/auth/exchange-token',
    },
    // ... 기타 API 라우트
  },
} as const;
```

### 유틸리티 함수

```tsx
// 라우트 검증
validateRoute.gameId(gameId: string): boolean
validateRoute.leetCodeId(id: string): boolean

// 타입 안전한 라우트 빌더
buildRoute.gameRoom(gameId: string): string
buildRoute.leetCodeDetail(id: string): string
```

## 마이그레이션 가이드

### Before (기존 방식)

```tsx
// ❌ 하드코딩된 경로
router.push('/dashboard');
router.push(`/game/${gameId}`);
router.replace('/login');

// ❌ 문자열 오타 가능성
router.push('/dashbord'); // 오타!
```

### After (새로운 방식)

```tsx
// ✅ 타입 안전한 헬퍼 메서드
routerHelper.goToDashboard();
routerHelper.goToGameRoom(gameId);
routerHelper.replaceToLogin();

// ✅ 라우트 상수 사용
routerHelper.push(ROUTES.DASHBOARD);
routerHelper.push(ROUTES.GAME_ROOM(gameId));

// ✅ 자동 검증
if (routerHelper.isValidGameId(gameId)) {
  routerHelper.goToGameRoom(gameId);
}
```

## 장점

1. **유지보수성**: 경로 변경 시 한 곳만 수정하면 됨
2. **타입 안전성**: TypeScript로 컴파일 타임 오류 방지
3. **일관성**: 프로젝트 전체에서 동일한 라우팅 패턴
4. **검증**: 유효하지 않은 ID나 경로 자동 검증
5. **개발자 경험**: 자동완성과 IntelliSense 지원
6. **리팩토링**: IDE의 리팩토링 도구로 안전한 경로 변경

## 주의사항

- `routerHelper`는 `useRouter()` 훅과 함께 사용해야 합니다
- 동적 라우트의 경우 ID 검증을 권장합니다
- API 라우트는 참조용이며 실제 네비게이션에는 사용하지 않습니다
- 기존 `router.push()` 방식도 여전히 사용 가능합니다

## 예제

전체 사용 예제는 `frontend/src/components/examples/RouterExample.tsx`를 참조하세요.
