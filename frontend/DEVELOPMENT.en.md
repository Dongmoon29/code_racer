# Code Racer Frontend Development Guide

[한국어](DEVELOPMENT.md) | [English](DEVELOPMENT.en.md)

## 🚀 Getting Started

### Development Environment Setup

1. **Install Node.js**

   ```bash
   # macOS
   brew install node

   # Ubuntu/Debian
   sudo apt-get install nodejs npm

   # Windows
   # Download from https://nodejs.org/
   ```

2. **Install Dependencies**

   ```bash
   cd frontend
   npm install
   ```

3. **Environment Variables**

   ```bash
   # Create .env.local file
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
   ```

4. **Start Development Server**

   ```bash
   npm run dev
   ```

## 🏗️ Architecture

### Technology Stack

- **Next.js 15.2**: React-based full-stack framework
- **React 18.3**: UI library
- **TypeScript**: Type safety
- **TailwindCSS 4**: Utility-first CSS framework
- **CodeMirror 6**: Code editor (with Vim mode support)
- **Zustand**: Lightweight state management
- **Radix UI**: Accessibility-focused headless components
- **next-themes**: Theme system

### Project Structure

```
frontend/src/
├── pages/              # Page routing (Next.js Pages Router)
│   ├── _app.tsx       # App entry point, global configuration
│   ├── index.tsx      # Home page
│   ├── login.tsx      # Login page
│   ├── register.tsx   # Registration page
│   ├── dashboard.tsx  # Dashboard
│   └── game/
│       └── [id].tsx   # Dynamic game room page
├── components/         # Reusable components
│   ├── auth/          # Authentication components
│   ├── game/          # Game-related components
│   ├── layout/        # Layout components
│   └── ui/            # Basic UI components
├── lib/               # Library configuration and utilities
├── stores/            # Zustand state management
├── hooks/             # Custom React hooks
├── styles/            # Global styles
└── types/             # TypeScript type definitions
```

## 📝 Development Conventions

### 1. File and Folder Naming

- **Components**: PascalCase (e.g., `CodeEditor.tsx`)
- **Pages**: kebab-case (e.g., `game/[id].tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Utilities**: camelCase (e.g., `api.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS`)

### 2. Component Writing Guide

#### Basic Component Structure

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface ComponentNameProps {
  className?: string;
  children?: React.ReactNode;
  // ... other props
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('default-styles', className)} {...props}>
      {children}
    </div>
  );
};
```

#### Type Definitions

```typescript
// Interface naming: Props suffix
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

// API response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

### 3. State Management (Zustand)

#### Store Writing Example

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
        // Logout logic
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

### 4. API Calls

#### Using API Client

```typescript
import { authApi, gameApi } from '@/lib/api';

// Within component
const handleLogin = async (email: string, password: string) => {
  try {
    const response = await authApi.login({ email, password });
    if (response.success) {
      // Success handling
      useAuthStore.getState().login(response.data.user);
    }
  } catch (error) {
    // Error handling
    console.error('Login failed:', error);
  }
};
```

## 🎨 Styling Guide

### TailwindCSS Usage

#### Basic Principles

1. **Utility classes first**
2. **Responsive design**: `sm:`, `md:`, `lg:`, `xl:` prefixes
3. **Dark mode**: `dark:` prefix
4. **Minimize custom CSS**

#### Component Style Example

```typescript
const Button = ({ variant, size, className, ...props }) => {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:opacity-50 disabled:pointer-events-none',
        
        // Variant styles
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
          'border border-input hover:bg-accent hover:text-accent-foreground': variant === 'outline',
        },
        
        // Size styles
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

### Theme System

#### Using CSS Variables

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

#### Theme Usage

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

## 🎮 Game Component Development

### CodeEditor Component

#### Basic Usage

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
      placeholder="Enter your code..."
    />
  );
};
```

#### Language Configuration

```typescript
// lib/language-support.ts
export const SUPPORTED_LANGUAGES = {
  javascript: {
    name: 'JavaScript',
    extension: javascript(),
    template: 'function solution() {\n  // Write your code here\n}',
  },
  python: {
    name: 'Python',
    extension: python(),
    template: 'def solution():\n    # Write your code here\n    pass',
  },
  // ... other languages
};
```

### WebSocket Connection Management

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
          // Handle opponent code update
          break;
        case 'game_start':
          // Handle game start
          break;
        case 'game_end':
          // Handle game end
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
      {/* Game UI */}
    </div>
  );
};
```

## 🔧 Utilities and Helpers

### Class Name Utility

```typescript
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### API Error Handling

```typescript
// lib/api.ts
export const handleApiError = (error: any) => {
  if (error.response?.data?.error) {
    return error.response.data.error.message;
  }
  return error.message || 'An unknown error occurred.';
};

// Usage example
try {
  await gameApi.joinGame(gameId);
} catch (error) {
  const errorMessage = handleApiError(error);
  toast.error(errorMessage);
}
```

### Local Storage Helper

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

## 🧪 Testing

### Component Testing

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

### Running Tests

```bash
# Unit tests
npm run test

# Test coverage
npm run test:coverage

# E2E tests (Playwright)
npm run test:e2e
```

## 📱 Responsive Design

### Breakpoints

```typescript
// Tailwind default breakpoints
const breakpoints = {
  sm: '640px',   // Mobile landscape/small tablet
  md: '768px',   // Tablet
  lg: '1024px',  // Small desktop
  xl: '1280px',  // Desktop
  '2xl': '1536px', // Large screen
};
```

### Responsive Component Example

```typescript
const ResponsiveLayout = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="p-4 bg-card rounded-lg">
        {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
      </div>
    </div>
  );
};
```

## 🚀 Build and Deployment

### Build Commands

```bash
# Development build
npm run build

# Production build
npm run build:prod

# Static export
npm run export
```

### Environment-specific Configuration

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
    appDir: false, // Using Pages Router
  },
};

export default nextConfig;
```

## 🐛 Debugging

### Development Tools

1. **React Developer Tools**: Component tree inspection
2. **Next.js DevTools**: Performance analysis
3. **Browser DevTools**: Network, console debugging

### Logging

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

## 📚 Additional Resources

### Official Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [CodeMirror 6 Documentation](https://codemirror.net/docs/)

### Useful Tools

- [Radix UI](https://www.radix-ui.com/) - Accessibility components
- [Lucide React](https://lucide.dev/) - Icon library
- [next-themes](https://github.com/pacocoursey/next-themes) - Theme management
- [Zustand](https://github.com/pmndrs/zustand) - State management

## 🤝 Contributing

### Adding New Components

1. Choose appropriate location in `components/` directory
2. Define TypeScript interfaces
3. Include accessibility considerations
4. Write tests
5. Add Storybook stories (optional)

### Code Review Checklist

- [ ] Are TypeScript type definitions accurate?
- [ ] Does it follow accessibility guidelines?
- [ ] Is responsive design applied?
- [ ] Is error handling appropriate?
- [ ] Are tests written?
- [ ] Is performance optimization considered?

### Git Conventions

```bash
# Commit message format
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Code formatting
refactor: Code refactoring
test: Add/modify tests
chore: Build process or auxiliary feature modification

# Examples
feat: Add Vim mode support to CodeEditor
fix: Fix WebSocket reconnection logic
docs: Update frontend development guide
```

## 📞 Contact

If you have frontend development-related questions or suggestions:

1. Create a GitHub issue
2. Contact the development team
3. Check this documentation

---

This guide provides comprehensive reference material for Code Racer frontend development and will be continuously updated as the project evolves.