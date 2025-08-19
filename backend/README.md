# Code Racer Backend

Code Racer는 실시간 코딩 대결 게임을 위한 백엔드 API 서버입니다.

## 🚀 기술 스택

- **언어**: Go 1.24.0
- **웹 프레임워크**: Gin
- **데이터베이스**: PostgreSQL (GORM)
- **캐시**: Redis
- **인증**: JWT, OAuth2 (Google, GitHub)
- **코드 실행**: Judge0 API
- **로깅**: Zerolog
- **테스팅**: Testify

## 📁 프로젝트 구조

```
backend/
├── cmd/api/                 # 애플리케이션 진입점
│   └── main.go             # 메인 애플리케이션
├── internal/                # 내부 패키지
│   ├── config/             # 설정 관리
│   ├── controller/         # HTTP 컨트롤러
│   ├── middleware/         # 미들웨어
│   ├── model/              # 데이터 모델
│   ├── repository/         # 데이터 접근 계층
│   ├── service/            # 비즈니스 로직
│   ├── router/             # 라우팅 설정
│   ├── judge/              # 코드 실행 관련
│   ├── interfaces/         # 인터페이스 정의
│   ├── types/              # 타입 정의
│   ├── util/               # 유틸리티 함수
│   └── logger/             # 로깅 설정
├── migrations/              # 데이터베이스 마이그레이션
├── deployment/              # 배포 관련 파일
├── docker-compose.yml       # 개발 환경 설정
├── Dockerfile              # 컨테이너 이미지
└── go.mod                  # Go 모듈 의존성
```

## 🛠️ 설치 및 실행

### 사전 요구사항

- Go 1.24.0 이상
- PostgreSQL 12 이상
- Redis 6.0 이상
- Docker & Docker Compose (선택사항)

### 환경 변수 설정

`.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=code_racer
DB_PORT=5432

# Redis 설정
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=

# JWT 설정
JWT_SECRET=your_jwt_secret_key

# 서버 설정
PORT=8080
FRONTEND_URL=http://localhost:3000

# Judge0 API 설정
JUDGE0_API_KEY=your_judge0_api_key
JUDGE0_API_ENDPOINT=https://judge0-ce.p.rapidapi.com

# OAuth 설정 (Google)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth 설정 (GitHub)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 로컬 실행

```bash
# 의존성 설치
go mod download

# 데이터베이스 마이그레이션 실행
# (PostgreSQL이 실행 중이어야 함)

# 애플리케이션 실행
go run cmd/api/main.go
```

### Docker로 실행

```bash
# 개발 환경 실행
docker-compose up -d

# 애플리케이션 실행
go run cmd/api/main.go
```

## 🗄️ 데이터베이스

### 스키마

주요 테이블:

- `users`: 사용자 정보
- `games`: 게임 세션
- `leetcode_problems`: LeetCode 문제
- `game_submissions`: 게임 제출 기록

### 마이그레이션

```bash
# 마이그레이션 파일이 migrations/ 폴더에 있습니다
# 필요시 추가 마이그레이션을 생성하세요
```

## 🔌 API 엔드포인트

### 인증

- `POST /api/auth/register` - 사용자 등록
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/github` - GitHub OAuth

### 게임

- `GET /api/games` - 게임 목록 조회
- `POST /api/games` - 새 게임 생성
- `GET /api/games/:id` - 게임 정보 조회
- `POST /api/games/:id/join` - 게임 참가
- `POST /api/games/:id/submit` - 솔루션 제출
- `POST /api/games/:id/close` - 게임 종료

### 사용자

- `GET /api/users/me` - 현재 사용자 정보
- `GET /api/users/:userId/profile` - 사용자 프로필
- `PUT /api/users/profile` - 프로필 업데이트

### LeetCode 문제 (Admin)

- `GET /api/leetcode` - 문제 목록
- `GET /api/leetcode/:id` - 문제 상세
- `POST /api/leetcode` - 새 문제 생성
- `PUT /api/leetcode/:id` - 문제 수정
- `DELETE /api/leetcode/:id` - 문제 삭제

### WebSocket

- `GET /ws/:gameId` - 실시간 게임 통신

## 🔐 인증 및 권한

### JWT 토큰

- 액세스 토큰 기반 인증
- 미들웨어를 통한 자동 토큰 검증

### OAuth2

- Google OAuth 지원
- GitHub OAuth 지원

### 권한 레벨

- 일반 사용자: 게임 참가, 솔루션 제출
- 관리자: LeetCode 문제 관리

## 🧪 테스트

```bash
# 전체 테스트 실행
go test ./...

# 특정 패키지 테스트
go test ./internal/controller

# 테스트 커버리지 확인
go test -cover ./...
```

## 📊 모니터링

### 로깅

- Zerolog를 사용한 구조화된 로깅
- 개발/프로덕션 환경별 로그 레벨 설정
- JSON 형식 로그 출력

### 헬스체크

- `GET /health` 엔드포인트로 서버 상태 확인

## 🚀 배포

### Docker 이미지 빌드

```bash
docker build -t code-racer-backend .
```

### 환경별 설정

- 개발: `gin.DebugMode`
- 프로덕션: `gin.ReleaseMode`

## 🔧 개발 가이드

### 코드 구조 원칙

1. **계층 분리**: Controller → Service → Repository → Model
2. **의존성 주입**: 인터페이스를 통한 느슨한 결합
3. **에러 처리**: 구조화된 에러 응답
4. **로깅**: 모든 중요 작업에 대한 로깅

### 새로운 기능 추가

1. 모델 정의 (`internal/model/`)
2. 레포지토리 구현 (`internal/repository/`)
3. 서비스 로직 구현 (`internal/service/`)
4. 컨트롤러 구현 (`internal/controller/`)
5. 라우터에 엔드포인트 추가 (`internal/router/`)

### 테스트 작성

- 각 계층별 단위 테스트 작성
- 테스트 유틸리티 활용 (`internal/testutil/`)
- 모킹을 통한 의존성 격리

## 🐛 문제 해결

### 일반적인 문제

1. **데이터베이스 연결 실패**: 환경 변수 확인
2. **Redis 연결 실패**: Redis 서버 상태 확인
3. **JWT 토큰 오류**: JWT_SECRET 환경 변수 확인
4. **Judge0 API 오류**: API 키 및 엔드포인트 확인

### 로그 확인

```bash
# 애플리케이션 로그 확인
tail -f logs/app.log

# 데이터베이스 로그 확인
docker logs postgres
```

## 📝 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 문의

프로젝트에 대한 질문이나 제안사항이 있으시면 이슈를 생성해 주세요.
