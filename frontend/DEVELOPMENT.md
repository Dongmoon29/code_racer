# Code Racer 프론트엔드 개발 가이드

[한국어](DEVELOPMENT.md) | [English](DEVELOPMENT.en.md)

## 🚀 시작하기

### 개발 환경 설정

1. **Node.js 설치**

   ```bash
   # macOS
   brew install node

   # Ubuntu/Debian
   sudo apt-get install nodejs npm

   # Windows
   # https://nodejs.org/ 에서 다운로드
   ```

2. **의존성 설치**

   ```bash
   cd frontend
   npm install
   ```

3. **환경 변수 설정**

   ```bash
   # .env.local 파일 생성
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
   ```

4. **개발 서버 실행**

   ```bash
   npm run dev
   ```

## 🏗️ 아키텍처

### 기술 스택

- **Next.js 15.2**: React 기반 풀스택 프레임워크
- **React 18.3**: UI 라이브러리
- **TypeScript**: 타입 안전성
- **TailwindCSS 4**: 유틸리티 우선 CSS 프레임워크
- **CodeMirror 6**: 코드 에디터 (Vim 모드 지원)
- **Zustand**: 가벼운 상태 관리
- **Radix UI**: 접근성 중심 headless 컴포넌트
- **next-themes**: 테마 시스템

### 프로젝트 구조

```
frontend/src/
├── pages/              # 페이지 라우팅 (Next.js Pages Router)
│   ├── _app.tsx       # 앱 진입점, 전역 설정
│   ├── index.tsx      # 홈페이지
│   ├── login.tsx      # 로그인 페이지
│   ├── register.tsx   # 회원가입 페이지
│   ├── dashboard.tsx  # 대시보드
│   └── game/
│       └── [id].tsx   # 동적 게임 룸 페이지
├── components/         # 재사용 가능한 컴포넌트
│   ├── auth/          # 인증 관련 컴포넌트
│   ├── game/          # 게임 관련 컴포넌트
│   ├── layout/        # 레이아웃 컴포넌트
│   └── ui/            # 기본 UI 컴포넌트
├── lib/               # 라이브러리 설정 및 유틸리티
├── stores/            # Zustand 상태 관리
├── hooks/             # 커스텀 React 훅
├── styles/            # 전역 스타일
└── types/             # TypeScript 타입 정의
```

## 📝 개발 컨벤션

### 1. 파일 및 폴더 네이밍

- **컴포넌트**: PascalCase (예: `CodeEditor.tsx`)
- **페이지**: kebab-case (예: `game/[id].tsx`)
- **훅**: camelCase, `use` 접두사 (예: `useAuth.ts`)
- **유틸리티**: camelCase (예: `api.ts`)
- **상수**: UPPER_SNAKE_CASE (예: `API_ENDPOINTS`)

### 2. 컴포넌트 작성 가이드

#### 기본 컴포넌트 구조

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface ComponentNameProps {
  className?: string;
  children?: React.ReactNode;
  // ... 기타 props
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('기본-스타일', className)} {...props}>
      {children}
    </div>
  );
};
```

#### 타입 정의

```typescript
// 인터페이스 네이밍: Props 접미사
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

// API 응답 타입
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

### 3. 상태 관리 (Zustand)

#### Store 작성 예시

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (user: User) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isLoggedIn: false,
      isLoading: false,

      // Actions
      login: (user) => {
        set({ user, isLoggedIn: true });
      },

      logout: async () => {
        // 로그아웃 로직
        set({ user: null, isLoggedIn: false });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isLoggedIn: state.isLoggedIn }),
    }
  )
);
```

### 4. API 호출

#### API 클라이언트 사용

```typescript
import { authApi, gameApi } from '@/lib/api';

// 컴포넌트 내에서
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await authApi.login({ email, password });
    if (response.success) {
      // 성공 처리
      useAuthStore.getState().login(response.data.user);
    }
  } catch (error) {
    // 에러 처리
    console.error('로그인 실패:', error);
  }
};
```

## 🎨 스타일링 가이드

### TailwindCSS 사용법

#### 기본 원칙

1. **유틸리티 클래스 우선 사용**
2. **반응형 디자인**: `sm:`, `md:`, `lg:`, `xl:` 접두사
3. **다크 모드**: `dark:` 접두사
4. **커스텀 CSS 최소화**

#### 컴포넌트 스타일 예시

```typescript
const Button = ({ variant, size, className, ...props }) => {
  return (
    <button
      className={cn(
        // 기본 스타일
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:opacity-50 disabled:pointer-events-none',
        
        // Variant 스타일
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
          'border border-input hover:bg-accent hover:text-accent-foreground': variant === 'outline',
        },
        
        // Size 스타일
        {
          'h-10 px-4 py-2': size === 'default',
          'h-9 rounded-md px-3': size === 'sm',
          'h-11 rounded-md px-8': size === 'lg',
        },
        
        className
      )}
      {...props}
    />
  );
};
```

### 테마 시스템

#### CSS 변수 활용

```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  --primary: 142 88% 22%;
  --primary-foreground: 0 0% 100%;
}

.dark {
  --background: 215 14% 16%;
  --foreground: 210 18% 85%;
  --primary: 142 88% 22%;
  --primary-foreground: 0 0% 100%;
}
```

#### 테마 사용

```typescript
import { useTheme } from 'next-themes';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-md hover:bg-accent"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
};
```

## 🎮 게임 관련 컴포넌트 개발

### CodeEditor 컴포넌트

#### 기본 사용법

```typescript
import { CodeEditor } from '@/components/game/CodeEditor';

const GamePage = () => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');

  return (
    <CodeEditor
      value={code}
      onChange={setCode}
      language={language}
      theme="vs-dark"
      vimMode={true}
      readOnly={false}
      placeholder="코드를 입력하세요..."
    />
  );
};
```

#### 언어별 설정

```typescript
// lib/language-support.ts
export const SUPPORTED_LANGUAGES = {
  javascript: {
    name: 'JavaScript',
    extension: javascript(),
    template: 'function solution() {\n  // 코드를 작성하세요\n}',
  },
  python: {
    name: 'Python',
    extension: python(),
    template: 'def solution():\n    # 코드를 작성하세요\n    pass',
  },
  // ... 기타 언어
};
```

### WebSocket 연결 관리

```typescript
import { WebSocketClient } from '@/lib/websocket';

const GameRoom = ({ gameId }: { gameId: string }) => {
  const [ws, setWs] = useState<WebSocketClient | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const websocket = new WebSocketClient(gameId, token);
    
    websocket.onMessage = (data) => {
      switch (data.type) {
        case 'code_update':
          // 상대방 코드 업데이트 처리
          break;
        case 'game_start':
          // 게임 시작 처리
          break;
        case 'game_end':
          // 게임 종료 처리
          break;
      }
    };

    websocket.connect();
    setWs(websocket);

    return () => {
      websocket.disconnect();
    };
  }, [gameId]);

  const handleCodeChange = (newCode: string) => {
    ws?.sendMessage('code_update', { code: newCode, language });
  };

  return (
    <div>
      {/* 게임 UI */}
    </div>
  );
};
```

## 🔧 유틸리티 및 헬퍼

### 클래스 네임 유틸리티

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### API 에러 핸들링

```typescript
// lib/api.ts
export const handleApiError = (error: any) => {
  if (error.response?.data?.error) {
    return error.response.data.error.message;
  }
  return error.message || '알 수 없는 오류가 발생했습니다.';
};

// 사용 예시
try {
  await gameApi.joinGame(gameId);
} catch (error) {
  const errorMessage = handleApiError(error);
  toast.error(errorMessage);
}
```

### 로컬 스토리지 헬퍼

```typescript
// lib/storage.ts
export const storage = {
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};
```

## 🧪 테스트

### 컴포넌트 테스트

```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 테스트 실행

```bash
# 단위 테스트
npm run test

# 테스트 커버리지
npm run test:coverage

# E2E 테스트 (Playwright)
npm run test:e2e
```

## 📱 반응형 디자인

### 브레이크포인트

```typescript
// Tailwind 기본 브레이크포인트
const breakpoints = {
  sm: '640px',   // 모바일 가로/작은 태블릿
  md: '768px',   // 태블릿
  lg: '1024px',  // 작은 데스크톱
  xl: '1280px',  // 데스크톱
  '2xl': '1536px', // 큰 화면
};
```

### 반응형 컴포넌트 예시

```typescript
const ResponsiveLayout = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="p-4 bg-card rounded-lg">
        {/* 모바일: 1열, 태블릿: 2열, 데스크톱: 3열 */}
      </div>
    </div>
  );
};
```

## 🚀 빌드 및 배포

### 빌드 명령어

```bash
# 개발 빌드
npm run build

# 프로덕션 빌드
npm run build:prod

# 정적 내보내기
npm run export
```

### 환경별 설정

```typescript
// next.config.ts
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
  images: {
    domains: ['localhost', 'your-production-domain.com'],
  },
  experimental: {
    appDir: false, // Pages Router 사용
  },
};

export default nextConfig;
```

## 🐛 디버깅

### 개발 도구

1. **React Developer Tools**: 컴포넌트 트리 확인
2. **Next.js DevTools**: 성능 분석
3. **Browser DevTools**: 네트워크, 콘솔 디버깅

### 로깅

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, data);
    }
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data);
    }
  },
};
```

## 📚 추가 리소스

### 공식 문서

- [Next.js 문서](https://nextjs.org/docs)
- [React 문서](https://react.dev/)
- [TailwindCSS 문서](https://tailwindcss.com/docs)
- [CodeMirror 6 문서](https://codemirror.net/docs/)

### 유용한 도구

- [Radix UI](https://www.radix-ui.com/) - 접근성 컴포넌트
- [Lucide React](https://lucide.dev/) - 아이콘 라이브러리
- [next-themes](https://github.com/pacocoursey/next-themes) - 테마 관리
- [Zustand](https://github.com/pmndrs/zustand) - 상태 관리

## 🤝 기여하기

### 새로운 컴포넌트 추가

1. `components/` 디렉토리에 적절한 위치 선택
2. TypeScript 인터페이스 정의
3. 접근성 고려사항 포함
4. 테스트 작성
5. Storybook 스토리 추가 (선택사항)

### 코드 리뷰 체크리스트

- [ ] TypeScript 타입 정의가 정확한가?
- [ ] 접근성 가이드라인을 따르는가?
- [ ] 반응형 디자인이 적용되었는가?
- [ ] 에러 핸들링이 적절한가?
- [ ] 테스트가 작성되었는가?
- [ ] 성능 최적화가 고려되었는가?

### Git 컨벤션

```bash
# 커밋 메시지 형식
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 과정 또는 보조 기능 수정

# 예시
feat: CodeEditor에 Vim 모드 지원 추가
fix: WebSocket 재연결 로직 수정
docs: 프론트엔드 개발 가이드 업데이트
```

## 📞 문의

프론트엔드 개발 관련 질문이나 제안사항이 있으시면:

1. GitHub 이슈를 생성하세요
2. 개발팀에 연락하세요
3. 이 문서를 확인하세요

---

이 가이드는 Code Racer 프론트엔드 개발을 위한 포괄적인 참고 자료입니다. 프로젝트가 발전함에 따라 지속적으로 업데이트됩니다.