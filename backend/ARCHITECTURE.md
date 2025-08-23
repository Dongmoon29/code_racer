# Backend Architecture Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Core Architecture](#core-architecture)
5. [Database Design](#database-design)
6. [API Design](#api-design)
7. [Authentication & Authorization](#authentication--authorization)
8. [WebSocket Service](#websocket-service)
9. [Code Execution & Judging](#code-execution--judging)
10. [Error Handling & Logging](#error-handling--logging)
11. [Testing Strategy](#testing-strategy)
12. [Deployment & DevOps](#deployment--devops)
13. [Security Considerations](#security-considerations)

## 🎯 Overview

CodeRacer 백엔드는 **Go (Golang)** 기반의 고성능 웹 서비스로, 실시간 코딩 대결 플랫폼의 핵심 기능을 제공합니다.

### Key Features

- **RESTful API**: HTTP 기반 REST API 서비스
- **Real-time Communication**: WebSocket을 통한 실시간 통신
- **Code Execution**: Judge0를 통한 안전한 코드 실행
- **Role-based Access Control**: Admin/User 역할 기반 권한 관리
- **OAuth Integration**: Google, GitHub 소셜 로그인
- **Database Management**: PostgreSQL + Redis 하이브리드 저장소

## 🛠 Technology Stack

### Core Language & Framework

- **Go 1.25**: 고성능 시스템 프로그래밍 언어
- **Gin**: 고성능 HTTP 웹 프레임워크
- **GORM**: Go ORM 라이브러리

### Database & Cache

- **PostgreSQL**: 주 데이터베이스
- **Redis**: 캐시 및 WebSocket 세션 관리
- **GORM**: 데이터베이스 ORM

### Authentication & Security

- **JWT**: JSON Web Token 기반 인증
- **bcrypt**: 비밀번호 해싱
- **OAuth 2.0**: 소셜 로그인

### Code Execution

- **Judge0**: 코드 실행 및 채점 서비스
- **Docker**: 코드 실행 환경 격리

### Development & Testing

- **Testify**: 테스트 프레임워크
- **Mockery**: Mock 객체 생성
- **Go Modules**: 의존성 관리

## 📁 Project Structure

```
backend/
├── cmd/
│   └── api/
│       ├── main.go              # 애플리케이션 진입점
│       └── main_test.go         # 메인 함수 테스트
├── internal/                     # 내부 패키지
│   ├── config/                  # 설정 관리
│   ├── constants/               # 상수 정의
│   ├── controller/              # HTTP 컨트롤러
│   ├── factory/                 # 팩토리 패턴
│   ├── interfaces/              # 인터페이스 정의
│   ├── judge/                   # 코드 실행 및 채점
│   ├── logger/                  # 로깅 시스템
│   ├── middleware/              # HTTP 미들웨어
│   ├── model/                   # 데이터 모델
│   ├── repository/              # 데이터 접근 계층
│   ├── router/                  # 라우팅 설정
│   ├── seed/                    # 초기 데이터
│   ├── service/                 # 비즈니스 로직
│   ├── testutil/                # 테스트 유틸리티
│   ├── types/                   # 타입 정의
│   └── util/                    # 유틸리티 함수
├── migrations/                   # 데이터베이스 마이그레이션
├── deployment/                   # 배포 관련 파일
├── docker-compose.yml           # 개발 환경 설정
├── Dockerfile                   # 컨테이너 이미지
├── go.mod                       # Go 모듈 정의
├── go.sum                       # 의존성 체크섬
└── README.md                    # 프로젝트 문서
```

## 🏗 Core Architecture

### Architecture Principles

1. **Clean Architecture**: 계층별 관심사 분리
2. **Dependency Injection**: 의존성 주입 패턴
3. **Interface Segregation**: 인터페이스 분리 원칙
4. **Single Responsibility**: 단일 책임 원칙

### Layer Architecture

```
┌─────────────────────────────────────┐
│           HTTP Layer                │
│        (Gin Router)                 │
├─────────────────────────────────────┤
│         Controller Layer            │
│      (Request/Response)             │
├─────────────────────────────────────┤
│          Service Layer              │
│       (Business Logic)              │
├─────────────────────────────────────┤
│        Repository Layer             │
│      (Data Access)                  │
├─────────────────────────────────────┤
│         Database Layer              │
│    (PostgreSQL + Redis)            │
└─────────────────────────────────────┘
```

### Design Patterns

- **Repository Pattern**: 데이터 접근 추상화
- **Factory Pattern**: 객체 생성 패턴
- **Middleware Pattern**: HTTP 요청/응답 처리
- **Strategy Pattern**: 알고리즘 선택 패턴

## 🗄 Database Design

### Database Schema

#### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### LeetCode Problems Table

```sql
CREATE TABLE leetcode_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    examples TEXT NOT NULL,
    constraints TEXT NOT NULL,
    test_cases JSONB NOT NULL,
    expected_outputs TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    input_format TEXT NOT NULL,
    output_format TEXT NOT NULL,
    function_name VARCHAR(100) NOT NULL,
    javascript_template TEXT NOT NULL,
    python_template TEXT NOT NULL,
    go_template TEXT NOT NULL,
    java_template TEXT NOT NULL,
    cpp_template TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Games Table

```sql
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(id),
    opponent_id UUID REFERENCES users(id),
    leetcode_id UUID REFERENCES leetcode_problems(id),
    status VARCHAR(20) DEFAULT 'waiting',
    winner_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Redis Data Structure

- **Game Sessions**: `game:{gameID}:users`
- **User Code**: `game:{gameID}:user:{userID}:code`
- **Game Status**: `game:{gameID}`

## 🔌 API Design

### REST API Endpoints

#### Authentication

```
POST   /api/auth/login           # 로그인
POST   /api/auth/register        # 회원가입
GET    /api/auth/google          # Google OAuth
GET    /api/auth/github          # GitHub OAuth
GET    /api/users/me             # 현재 사용자 정보
```

#### Games

```
GET    /api/games                # 게임 목록
POST   /api/games                # 게임 생성
GET    /api/games/:id            # 게임 정보
PUT    /api/games/:id            # 게임 업데이트
DELETE /api/games/:id            # 게임 삭제
```

#### LeetCode Problems

```
GET    /api/leetcode             # 문제 목록
GET    /api/leetcode/:id         # 문제 상세
POST   /api/leetcode             # 문제 생성 (Admin)
PUT    /api/leetcode/:id         # 문제 수정 (Admin)
DELETE /api/leetcode/:id         # 문제 삭제 (Admin)
```

#### WebSocket

```
GET    /ws/:gameId               # WebSocket 연결
```

### API Response Format

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Success message"
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "field_name",
      "message": "Validation error"
    }
  ]
}
```

## 🔐 Authentication & Authorization

### JWT Token Structure

```go
type JWTClaims struct {
    UserID string `json:"user_id"`
    Email  string `json:"email"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}
```

### Authentication Flow

1. **Login**: 사용자 인증 → JWT 토큰 생성
2. **Token Validation**: 요청 시 토큰 검증
3. **Role Check**: 권한 기반 접근 제어

### Middleware Chain

```
Request → CORS → Logger → Auth → Role Check → Handler
```

### Role-based Access Control

- **User Role**: 기본 사용자 권한
- **Admin Role**: LeetCode 문제 관리 권한

## 🌐 WebSocket Service

### WebSocket Architecture

```go
type WebSocketService struct {
    hub *Hub
    rdb *redis.Client
    logger zerolog.Logger
}

type Hub struct {
    clients    map[*Client]bool
    broadcast  chan *GameMessage
    register   chan *Client
    unregister chan *Client
}
```

### Message Types

```go
type WebSocketMessage struct {
    Type      string      `json:"type"`
    Data      interface{} `json:"data,omitempty"`
    Timestamp int64       `json:"timestamp"`
}

type CodeUpdateMessage struct {
    Type   string `json:"type"`
    GameID string `json:"game_id"`
    UserID string `json:"user_id"`
    Code   string `json:"code"`
}
```

### Connection Management

1. **Connection**: JWT 토큰 기반 인증
2. **Message Handling**: 실시간 코드 동기화
3. **Disconnection**: 자동 정리 및 세션 관리

## ⚡ Code Execution & Judging

### Judge0 Integration

```go
type Judge0Client struct {
    baseURL    string
    apiKey     string
    httpClient *http.Client
}

type SubmissionRequest struct {
    SourceCode string `json:"source_code"`
    LanguageID int    `json:"language_id"`
    Stdin      string `json:"stdin"`
}
```

### Supported Languages

- **JavaScript**: Node.js 18.15.0
- **Python**: Python 3.10.2
- **Go**: Go 1.19.2
- **Java**: OpenJDK 13.0.1
- **C++**: GCC 9.4.0

### Code Execution Flow

1. **Code Submission**: 사용자 코드 제출
2. **Test Case Execution**: 테스트 케이스별 실행
3. **Result Validation**: 예상 결과와 비교
4. **Score Calculation**: 정확도 및 성능 점수

## 📝 Error Handling & Logging

### Error Handling Strategy

```go
type AppError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
    Details string `json:"details,omitempty"`
}

func (e *AppError) Error() string {
    return e.Message
}
```

### Logging System

```go
type Logger struct {
    logger zerolog.Logger
}

func (l *Logger) Info(msg string, fields map[string]interface{})
func (l *Logger) Error(err error, msg string, fields map[string]interface{})
func (l *Logger) Debug(msg string, fields map[string]interface{})
```

### Log Levels

- **DEBUG**: 개발 및 디버깅 정보
- **INFO**: 일반적인 애플리케이션 정보
- **WARN**: 경고 메시지
- **ERROR**: 오류 및 예외 상황

## 🧪 Testing Strategy

### Testing Structure

```
├── unit/                    # 단위 테스트
├── integration/             # 통합 테스트
├── e2e/                    # 엔드투엔드 테스트
└── testutil/               # 테스트 유틸리티
```

### Testing Tools

- **Testify**: 테스트 프레임워크
- **Mockery**: Mock 객체 생성
- **Testcontainers**: 데이터베이스 테스트

### Test Coverage Goals

- **Unit Tests**: 80% 이상
- **Integration Tests**: 핵심 기능 100%
- **E2E Tests**: 주요 사용자 시나리오

## 🚀 Deployment & DevOps

### Containerization

```dockerfile
FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
CMD ["./main"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - '8080:8080'
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgres://user:pass@postgres:5432/coderacer
      - REDIS_URL=redis://redis:6379
```

### CI/CD Pipeline

- **GitHub Actions**: 자동 빌드 및 테스트
- **Docker Hub**: 자동 이미지 빌드
- **Deployment**: 자동 배포

## 🔒 Security Considerations

### Security Measures

1. **Input Validation**: 모든 사용자 입력 검증
2. **SQL Injection Prevention**: GORM 사용으로 방지
3. **XSS Protection**: Content-Type 헤더 설정
4. **Rate Limiting**: API 요청 제한
5. **CORS Configuration**: 허용된 도메인만 접근

### Code Execution Security

1. **Sandboxing**: Docker 컨테이너 격리
2. **Resource Limits**: CPU, 메모리, 실행 시간 제한
3. **Network Isolation**: 외부 네트워크 접근 차단
4. **File System Restrictions**: 읽기 전용 파일 시스템

### Authentication Security

1. **JWT Expiration**: 토큰 만료 시간 설정
2. **Password Hashing**: bcrypt로 비밀번호 해싱
3. **OAuth Security**: HTTPS 통신 및 상태 검증

## 📊 Performance & Scalability

### Performance Optimization

1. **Database Indexing**: 자주 조회되는 컬럼 인덱싱
2. **Connection Pooling**: 데이터베이스 연결 풀 관리
3. **Caching Strategy**: Redis를 통한 캐싱
4. **Async Processing**: 비동기 작업 처리

### Scalability Considerations

1. **Horizontal Scaling**: 로드 밸런서를 통한 확장
2. **Database Sharding**: 데이터베이스 분산
3. **Microservices**: 기능별 서비스 분리
4. **Message Queues**: 비동기 작업 큐

## 🔮 Future Improvements

### Planned Features

1. **GraphQL API**: 유연한 데이터 쿼리
2. **Real-time Analytics**: 실시간 사용자 행동 분석
3. **Advanced Code Analysis**: 코드 품질 및 복잡도 분석
4. **Multi-language Support**: 더 많은 프로그래밍 언어 지원

### Technical Debt

1. **API Versioning**: API 버전 관리 체계
2. **Monitoring**: Prometheus + Grafana 모니터링
3. **Tracing**: OpenTelemetry 분산 추적
4. **Documentation**: API 문서 자동화

---

## 📚 Additional Resources

- [Go Documentation](https://golang.org/doc/)
- [Gin Framework](https://gin-gonic.com/docs/)
- [GORM Documentation](https://gorm.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Judge0 Documentation](https://judge0.com/docs)

---

_Last Updated: August 2024_
_Version: 1.0.0_
