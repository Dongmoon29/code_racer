# Frontend Architecture Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Architecture](#core-architecture)
5. [State Management](#state-management)
6. [Component Architecture](#component-architecture)
7. [Routing & Navigation](#routing--navigation)
8. [API Integration](#api-integration)
9. [Styling & UI](#styling--ui)
10. [Authentication Flow](#authentication-flow)
11. [WebSocket Integration](#websocket-integration)
12. [Development Guidelines](#development-guidelines)
13. [Performance Considerations](#performance-considerations)

## 🎯 Overview

CodeRacer 프론트엔드는 **Next.js 13+** 기반의 **TypeScript** 애플리케이션으로, 실시간 코딩 대결 플랫폼을 제공합니다.

### Key Features

- **실시간 게임**: WebSocket을 통한 실시간 코드 동기화
- **LeetCode 통합**: 알고리즘 문제 풀이 및 채점
- **멀티 언어 지원**: JavaScript, Python, Go, Java, C++
- **관리자 기능**: LeetCode 문제 관리 (Admin Role)
- **반응형 디자인**: Tailwind CSS 기반 모던 UI

## 🛠 Technology Stack

### Core Framework

- **Next.js 13+**: React 기반 풀스택 프레임워크
- **React 18**: 최신 React 기능 활용
- **TypeScript**: 타입 안전성 보장

### State Management

- **Zustand**: 경량 상태 관리 라이브러리
- **React Context**: 전역 상태 공유

### Styling & UI

- **Tailwind CSS**: 유틸리티 기반 CSS 프레임워크
- **shadcn/ui**: 재사용 가능한 UI 컴포넌트
- **Lucide React**: 아이콘 라이브러리

### Development Tools

- **ESLint**: 코드 품질 관리
- **PostCSS**: CSS 전처리
- **TypeScript**: 정적 타입 검사

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js 13+ App Router
│   ├── components/             # 재사용 가능한 컴포넌트
│   │   ├── admin/             # 관리자 전용 컴포넌트
│   │   ├── auth/              # 인증 관련 컴포넌트
│   │   ├── game/              # 게임 관련 컴포넌트
│   │   ├── layout/            # 레이아웃 컴포넌트
│   │   ├── profile/           # 프로필 관련 컴포넌트
│   │   └── ui/                # 기본 UI 컴포넌트
│   ├── contexts/              # React Context
│   ├── hooks/                 # 커스텀 React Hooks
│   ├── lib/                   # 유틸리티 및 설정
│   ├── pages/                 # 페이지 컴포넌트 (Pages Router)
│   ├── stores/                # Zustand 스토어
│   ├── styles/                # 전역 스타일
│   └── types/                 # TypeScript 타입 정의
├── public/                    # 정적 파일
├── package.json               # 의존성 관리
├── tailwind.config.ts         # Tailwind 설정
├── tsconfig.json              # TypeScript 설정
└── next.config.ts             # Next.js 설정
```

## 🏗 Core Architecture

### Architecture Principles

1. **Component-Based**: 재사용 가능한 컴포넌트 중심 설계
2. **Type Safety**: TypeScript로 런타임 오류 방지
3. **Separation of Concerns**: 관심사 분리 원칙
4. **Performance First**: 최적화된 렌더링 및 번들링

### Design Patterns

- **Container/Presentational Pattern**: 로직과 UI 분리
- **Custom Hooks**: 비즈니스 로직 재사용
- **Compound Components**: 복잡한 컴포넌트 구성

## 📊 State Management

### Zustand Store Structure

```typescript
// stores/authStore.ts
interface AuthStore {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;

  // Actions
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}
```

### State Flow

1. **User Action** → Component
2. **Component** → Store Action
3. **Store Action** → State Update
4. **State Update** → Component Re-render

### Global State vs Local State

- **Global State**: 사용자 인증, 게임 상태
- **Local State**: 폼 입력, UI 토글 상태

## 🧩 Component Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── Navigation
│   │   └── UserProfile
│   ├── Main Content
│   └── Footer
├── Pages
│   ├── Home
│   ├── Game
│   ├── Admin
│   └── Auth
└── Modals & Overlays
```

### Component Categories

#### 1. Layout Components

- **Layout.tsx**: 전체 레이아웃 구조
- **Header.tsx**: 네비게이션 및 사용자 메뉴
- **Footer.tsx**: 푸터 정보

#### 2. Game Components

- **GameRoom.tsx**: 게임 메인 컨테이너
- **CodeEditor.tsx**: 코드 에디터 (CodeMirror)
- **LanguageSelector.tsx**: 프로그래밍 언어 선택
- **Game States**: 게임 진행 상태별 컴포넌트

#### 3. Admin Components

- **LeetCodeForm.tsx**: LeetCode 문제 생성/수정
- **LeetCodeList.tsx**: 문제 목록 관리
- **AdminNav.tsx**: 관리자 네비게이션

#### 4. UI Components

- **Button.tsx**: 재사용 가능한 버튼
- **Card.tsx**: 카드 레이아웃
- **Alert.tsx**: 알림 메시지
- **Loading.tsx**: 로딩 스피너

### Component Props Pattern

```typescript
interface ComponentProps {
  // Required props
  title: string;
  onAction: (data: ActionData) => void;

  // Optional props
  variant?: 'primary' | 'secondary';
  disabled?: boolean;

  // Children
  children?: React.ReactNode;
}
```

## 🧭 Routing & Navigation

### Routing Strategy

- **App Router**: Next.js 13+ 새로운 라우팅 시스템
- **Pages Router**: 기존 페이지 기반 라우팅 (하이브리드)

### Route Structure

```
/                           # 홈페이지
/login                      # 로그인
/register                   # 회원가입
/dashboard                  # 사용자 대시보드
/game/[id]                 # 게임방
/admin                      # 관리자 패널
/admin/leetcode             # LeetCode 문제 관리
/admin/leetcode/create      # 문제 생성
/admin/leetcode/edit/[id]   # 문제 수정
```

### Navigation Flow

1. **Public Routes**: 인증 불필요
2. **Protected Routes**: 로그인 필요
3. **Admin Routes**: Admin Role 필요

## 🔌 API Integration

### API Client Architecture

```typescript
// lib/api.ts
class APIClient {
  private baseURL: string;
  private token: string | null;

  // Request interceptor
  private setupInterceptors(): void;

  // API methods
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, data: any): Promise<T>;
  put<T>(endpoint: string, data: any): Promise<T>;
  delete<T>(endpoint: string): Promise<T>;
}
```

### API Endpoints

#### Authentication

- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/github` - GitHub OAuth

#### Game

- `GET /api/games` - 게임 목록
- `GET /api/games/[id]` - 게임 정보
- `POST /api/games` - 게임 생성

#### LeetCode

- `GET /api/leetcode` - 문제 목록
- `POST /api/leetcode` - 문제 생성 (Admin)
- `PUT /api/leetcode/[id]` - 문제 수정 (Admin)
- `DELETE /api/leetcode/[id]` - 문제 삭제 (Admin)

### Error Handling

```typescript
interface ApiError {
  message: string;
  success: false;
  status?: number;
}

// Error handling pattern
try {
  const result = await apiClient.get('/endpoint');
  return result;
} catch (error) {
  if (error.response?.status === 401) {
    // Handle unauthorized
  }
  throw error;
}
```

## 🎨 Styling & UI

### Design System

#### Color Palette

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  --primary: 142 88% 22%;
  --muted: 0 0% 91%;
  --border: 0 0% 88%;
}
```

#### Typography

- **Headings**: Inter, system fonts
- **Body**: System fonts
- **Code**: JetBrains Mono, Fira Code

#### Spacing System

- **Base Unit**: 4px
- **Scale**: 4, 8, 12, 16, 20, 24, 32, 48, 64

### Component Styling Strategy

1. **Tailwind Utilities**: 기본 스타일링
2. **CSS Variables**: 테마 및 색상
3. **Component Variants**: 상태별 스타일
4. **Responsive Design**: 모바일 우선 접근

### Dark Mode Support

```typescript
// Theme switching
const { theme, setTheme } = useTheme();

// CSS variables for theming
.dark {
  --background: 215 14% 16%;
  --foreground: 210 18% 85%;
}
```

## 🔐 Authentication Flow

### Authentication States

```typescript
interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  token: string | null;
}
```

### Authentication Flow

1. **Login Process**

   ```
   User Input → Form Validation → API Call → Token Storage → State Update
   ```

2. **Token Management**

   - **Local Storage**: `authToken` 키로 저장
   - **Axios Interceptor**: 자동 헤더 추가
   - **Token Refresh**: 만료 시 자동 갱신

3. **Route Protection**

   ```typescript
   // Protected route wrapper
   const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
     const { isLoggedIn, isLoading } = useAuth();

     if (isLoading) return <Loading />;
     if (!isLoggedIn) return <Redirect to="/login" />;

     return <>{children}</>;
   };
   ```

### OAuth Integration

- **Google OAuth**: Google Identity Services
- **GitHub OAuth**: GitHub OAuth App
- **Role Assignment**: 신규 사용자 기본 'user' 역할

## 🌐 WebSocket Integration

### WebSocket Architecture

```typescript
// lib/websocket.ts
class WebSocketClient {
  private ws: WebSocket | null;
  private reconnectAttempts: number;

  // Connection management
  connect(gameId: string, token: string): void;
  disconnect(): void;
  reconnect(): void;

  // Message handling
  send(message: WebSocketMessage): void;
  onMessage(callback: (message: WebSocketMessage) => void): void;
}
```

### Message Types

```typescript
interface WebSocketMessage {
  type: 'auth' | 'ping' | 'code_update' | 'game_status';
  data?: any;
  timestamp: number;
}

interface CodeUpdateMessage {
  type: 'code_update';
  gameID: string;
  userID: string;
  code: string;
}
```

### Real-time Features

1. **Code Synchronization**: 실시간 코드 동기화
2. **Game Status Updates**: 게임 상태 실시간 업데이트
3. **Connection Management**: 자동 재연결 및 오류 처리

## 📝 Development Guidelines

### Code Standards

#### TypeScript

- **Strict Mode**: 엄격한 타입 검사
- **Interface First**: 타입 정의 우선
- **Generic Types**: 재사용 가능한 타입

#### React Best Practices

- **Functional Components**: 함수형 컴포넌트 사용
- **Hooks**: 커스텀 훅으로 로직 분리
- **Memoization**: React.memo, useMemo, useCallback 활용

#### File Naming

- **Components**: PascalCase (e.g., `CodeEditor.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useAuth.ts`)
- **Utilities**: camelCase (e.g., `api.ts`)

### Testing Strategy

- **Unit Tests**: Jest + React Testing Library
- **Component Tests**: 컴포넌트 격리 테스트
- **Integration Tests**: API 통합 테스트

### Performance Optimization

1. **Code Splitting**: Next.js 자동 코드 분할
2. **Image Optimization**: Next.js Image 컴포넌트
3. **Bundle Analysis**: webpack-bundle-analyzer
4. **Lazy Loading**: 동적 import 활용

## ⚡ Performance Considerations

### Rendering Optimization

- **React.memo**: 불필요한 리렌더링 방지
- **useMemo**: 계산 비용이 큰 값 메모이제이션
- **useCallback**: 함수 참조 안정성

### Bundle Optimization

- **Tree Shaking**: 사용하지 않는 코드 제거
- **Dynamic Imports**: 코드 분할
- **Asset Optimization**: 이미지, 폰트 최적화

### Monitoring

- **Core Web Vitals**: LCP, FID, CLS 측정
- **Bundle Size**: 번들 크기 모니터링
- **Error Tracking**: 사용자 경험 모니터링

## 🔮 Future Improvements

### Planned Features

1. **PWA Support**: Progressive Web App 기능
2. **Offline Mode**: 오프라인 상태 지원
3. **Advanced Analytics**: 사용자 행동 분석
4. **Accessibility**: 접근성 개선

### Technical Debt

1. **Test Coverage**: 테스트 커버리지 향상
2. **Performance**: 번들 크기 최적화
3. **Documentation**: API 문서화
4. **Error Boundaries**: 오류 경계 개선

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

---

_Last Updated: August 2024_
_Version: 1.0.0_
