# CodeRacer

[English](README.md) | [한국어](README.ko.md)

CodeRacer는 실시간 코딩 대결 플랫폼입니다. 친구들과 함께 코딩 문제를 풀면서 실력을 향상시키고 경쟁할 수 있습니다.

## 주요 기능

- 실시간 코딩 대결
- 다양한 프로그래밍 언어 지원 (JavaScript, Python, Go, Rust)
- LeetCode 스타일의 문제 풀이 (TBD)
- 실시간 채점 시스템
- 대시보드를 통한 진행 상황 모니터링 (TBD)

## 기술 스택

### 프론트엔드

- Next.js 15.2
- React 19
- TypeScript
- TailwindCSS
- CodeMirror 6
- Zustand (상태 관리)
- WebSocket

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
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret_key
SERVER_PORT=8080
JUDGE0_API_KEY=your_judge0_api_key
JUDGE0_API_ENDPOINT=https://judge0-ce.p.rapidapi.com

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

## 배포

Docker Compose를 사용한 배포:

```bash
docker-compose up -d
```

자세한 GCP 배포 가이드는 [deployment/README.md](deployment/README.md)를 참조하세요.

## 프로젝트 구조

```
.
├── backend/
│   ├── cmd/
│   ├── internal/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── middleware/
│   │   ├── model/
│   │   ├── repository/
│   │   └── service/
│   ├── migrations/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── styles/
│   └── Dockerfile
├── deployment/
│   ├── k8s/
│   └── terraform/
└── docker-compose.yml
```

## 기여하기

1. 프로젝트 포크하기
2. 기능 브랜치 생성 (`git checkout -b feature/멋진기능`)
3. 변경사항 커밋 (`git commit -m '멋진 기능 추가'`)
4. 브랜치에 푸시 (`git push origin feature/멋진기능`)
5. Pull Request 생성

## 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

프로젝트 링크: [https://github.com/Dongmoon29/code_racer](https://github.com/Dongmoon29/code_racer)
