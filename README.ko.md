# CodeRacer

[English](README.md) | [한국어](README.ko.md)

CodeRacer는 실시간 코딩 대결 플랫폼입니다. 친구들과 함께 코딩 문제를 풀면서 실력을 향상시키고 경쟁할 수 있습니다.

## 주요 기능

- **실시간 코딩 대결**: WebSocket 기반 실시간 멀티플레이어 게임
- **다양한 프로그래밍 언어 지원**: JavaScript, Python, Go, Rust, Java, C++
- **고급 코드 에디터**: CodeMirror 6 기반, Vim 모드 지원, 구문 강조
- **테마 시스템**: 다크/라이트 모드, 네온 효과 UI
- **LeetCode 스타일 문제**: 실제 코딩 테스트 문제 해결
- **실시간 코드 평가**: Judge0 API 기반 자동 채점 시스템
- **OAuth 로그인**: Google, GitHub 소셜 로그인 지원
- **반응형 디자인**: 모바일/데스크톱 최적화

## 기술 스택

### 프론트엔드

- Next.js 15.2
- React 18.3
- TypeScript
- TailwindCSS 4
- CodeMirror 6 (Vim mode 지원)
- Zustand (상태 관리)
- WebSocket (실시간 통신)
- Radix UI (접근성 컴포넌트)
- next-themes (테마 시스템)

### 백엔드

- Go 1.20
- Gin Web Framework
- GORM
- PostgreSQL
- Redis
- WebSocket
- JWT 인증

## 시작하기

### 사전 요구사항

- Node.js 18+
- Go 1.20+
- Docker & Docker Compose
- PostgreSQL 14
- Redis 7

### 로컬 개발 환경 설정

1. 저장소 클론

```bash
git clone https://github.com/Dongmoon29/code_racer.git
cd code_racer
```

2. 환경 변수 설정

```bash
# backend/.env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=code_racer
DB_PORT=5432
SERVER_PORT=8080
JUDGE0_API_KEY=your_judge0_api_key
JUDGE0_API_ENDPOINT=https://judge0-ce.p.rapidapi.com

FRONTEND_URL=http://localhost:3000
FRONTEND_DOMAIN=localhost

# JWT 설정
JWT_SECRET=your_jwt_secret_key

# Redis 설정
REDIS_HOST=localhost
REDIS_PORT=6379

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URL=your_google_redirect_url

# Github OAuth
GH_CLIENT_ID=your_github_client_id
GH_CLIENT_SECRET=your_github_client_secret
GH_REDIRECT_URL=your_github_redirect_url

# frontend/.env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

3. 데이터베이스 실행

```bash
docker-compose up postgres redis
```

4. 백엔드 실행

```bash
cd backend
go mod download
go run cmd/api/main.go
```

5. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

## 📖 문서

### 개발 가이드
- **백엔드 개발**: [한국어](backend/DEVELOPMENT.md) | [English](backend/DEVELOPMENT.en.md)
- **프론트엔드 개발**: [한국어](frontend/DEVELOPMENT.md) | [English](frontend/DEVELOPMENT.en.md)

### API 문서
- **REST API**: [한국어](backend/API.md) | [English](backend/API.en.md)
- **WebSocket 설정**: [한국어](backend/WEBSOCKET_SETUP.md) | [English](backend/WEBSOCKET_SETUP.en.md)

### 배포 가이드
- **GCP 배포**: [deployment/README.md](deployment/README.md)

## 프로젝트 구조

```
.
├── backend/                      # Go 백엔드 서버
│   ├── cmd/api/                 # 애플리케이션 진입점
│   │   └── main.go
│   ├── internal/                # 내부 패키지
│   │   ├── config/             # 설정 관리 (DB, Redis, JWT)
│   │   ├── controller/         # HTTP 핸들러
│   │   │   ├── auth_controller.go      # 인증 (로그인/회원가입/OAuth)
│   │   │   ├── game_controller.go      # 게임 관리
│   │   │   ├── user_controller.go      # 사용자 관리
│   │   │   └── websocket_controller.go # WebSocket 연결
│   │   ├── service/            # 비즈니스 로직
│   │   │   ├── auth_service.go         # JWT, OAuth 처리
│   │   │   ├── game_service.go         # 게임 상태 관리
│   │   │   ├── judge_service.go        # 코드 평가
│   │   │   ├── user_service.go         # 사용자 관리
│   │   │   └── websocket_service.go    # 실시간 통신
│   │   ├── repository/         # 데이터 접근 계층
│   │   ├── model/              # 데이터 모델
│   │   ├── middleware/         # 인증, CORS 미들웨어
│   │   ├── judge/              # Judge0 API 연동
│   │   ├── interfaces/         # 인터페이스 정의
│   │   ├── types/              # 타입 정의
│   │   ├── util/               # 유틸리티 함수
│   │   └── logger/             # 로깅 설정
│   ├── migrations/              # 데이터베이스 마이그레이션
│   ├── deployment/              # 배포 관련 파일 (Terraform)
│   └── docker-compose.yml       # 개발 환경 설정
├── frontend/                     # Next.js 프론트엔드
│   ├── src/
│   │   ├── pages/              # 페이지 라우팅
│   │   │   ├── index.tsx               # 홈페이지
│   │   │   ├── login.tsx               # 로그인 페이지
│   │   │   ├── dashboard.tsx           # 대시보드
│   │   │   └── game/[id].tsx           # 게임 룸
│   │   ├── components/         # React 컴포넌트
│   │   │   ├── game/                   # 게임 관련 컴포넌트
│   │   │   │   ├── CodeEditor.tsx      # CodeMirror 6 에디터
│   │   │   │   ├── GameRoom.tsx        # 게임 룸 관리
│   │   │   │   ├── RoomList.tsx        # 게임 방 목록
│   │   │   │   └── states/             # 게임 상태별 UI
│   │   │   ├── auth/                   # 인증 관련
│   │   │   ├── layout/                 # 레이아웃 컴포넌트
│   │   │   └── ui/                     # 재사용 UI 컴포넌트
│   │   ├── lib/                # 라이브러리 설정
│   │   │   ├── api.ts                  # API 클라이언트
│   │   │   ├── websocket.ts            # WebSocket 클라이언트
│   │   │   ├── language-support.ts     # 언어별 에디터 설정
│   │   │   └── editor-theme.ts         # 에디터 테마
│   │   ├── stores/             # Zustand 상태 관리
│   │   │   └── authStore.ts
│   │   ├── hooks/              # 커스텀 React 훅
│   │   │   └── useAuth.ts
│   │   └── styles/             # 스타일시트
│   │       └── globals.css             # 전역 CSS, 테마 시스템
│   ├── public/                  # 정적 파일
│   ├── components.json          # Radix UI 설정
│   ├── tailwind.config.ts       # Tailwind CSS 설정
│   └── next.config.ts           # Next.js 설정
├── .github/workflows/           # CI/CD 파이프라인
├── docker-compose.yml           # 전체 개발 환경
├── README.md                    # 프로젝트 문서 (영문)
└── README.ko.md                 # 프로젝트 문서 (한글)
```

## 기여하기

1. 프로젝트를 Fork 합니다
2. Feature 브랜치를 생성합니다 (`git checkout -b feature/멋진기능`)
3. 변경사항을 커밋합니다 (`git commit -m '멋진 기능을 추가했습니다'`)
4. 브랜치에 Push 합니다 (`git push origin feature/멋진기능`)
5. Pull Request를 생성합니다

## 라이선스

MIT 라이선스 - 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

프로젝트 링크: [https://github.com/Dongmoon29/code_racer](https://github.com/Dongmoon29/code_racer)

프로젝트 코드베이스에 대한 자세한 문서는 [https://app.komment.ai/wiki/github/Dongmoon29/code_racer?branch=main&version=1](https://app.komment.ai/wiki/github/Dongmoon29/code_racer?branch=main&version=1)를 참고하세요.
