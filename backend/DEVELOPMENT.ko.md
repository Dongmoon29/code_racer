# Code Racer 백엔드 개발 가이드

[한국어](DEVELOPMENT.md) | [English](DEVELOPMENT.en.md)

## 🚀 시작하기

### 개발 환경 설정

1. **Go 설치**

   ```bash
   # macOS
   brew install go

   # Ubuntu/Debian
   sudo apt-get install golang-go

   # Windows
   # https://golang.org/dl/ 에서 다운로드
   ```

2. **의존성 설치**

   ```bash
   cd backend
   go mod download
   ```

3. **데이터베이스 설정**

   ```bash
   # PostgreSQL 설치 (macOS)
   brew install postgresql
   brew services start postgresql

   # Redis 설치 (macOS)
   brew install redis
   brew services start redis
   ```

4. **환경 변수 설정**
   ```bash
   cp .env.example .env
   # .env 파일을 편집하여 실제 값으로 설정
   ```

### 프로젝트 실행

```bash
# 개발 모드로 실행
go run cmd/api/main.go

# 또는 빌드 후 실행
go build -o bin/api cmd/api/main.go
./bin/api
```

## 🏗️ 아키텍처

### 계층 구조

```
┌─────────────────┐
│   Controller    │ ← HTTP 요청/응답 처리
├─────────────────┤
│    Service      │ ← 비즈니스 로직
├─────────────────┤
│   Repository    │ ← 데이터 접근
├─────────────────┤
│     Model       │ ← 데이터 구조
└─────────────────┘
```

### 의존성 주입

`main.go`에서 모든 의존성을 초기화하고 주입합니다:

```go
func initializeDependencies(db *gorm.DB, rdb *redis.Client, cfg *config.Config, appLogger logger.Logger) *dependencies {
    // 레포지토리 초기화
    userRepository := repository.NewUserRepository(db, appLogger)

    // 서비스 초기화
    authService := service.NewAuthService(userRepository, cfg.JWTSecret, appLogger)

    // 컨트롤러 초기화
    authController := controller.NewAuthController(authService, appLogger)

    return &dependencies{
        authController: authController,
        // ... 기타 의존성
    }
}
```

## 📝 코딩 컨벤션

### 1. 파일 및 패키지 네이밍

- **파일명**: snake_case (예: `auth_controller.go`)
- **패키지명**: 소문자 (예: `package controller`)
- **디렉토리명**: 소문자 (예: `internal/controller/`)

### 2. 함수 및 변수 네이밍

- **함수명**: PascalCase (예: `CreateUser`)
- **변수명**: camelCase (예: `userID`)
- **상수명**: UPPER_SNAKE_CASE (예: `MAX_RETRY_COUNT`)

### 3. 인터페이스 네이밍

- **인터페이스명**: 동사 + er (예: `UserRepository`, `AuthService`)
- **파일명**: `interfaces.go` 또는 `_interfaces.go`

### 4. 에러 처리

```go
// 좋은 예
if err != nil {
    return fmt.Errorf("failed to create user: %w", err)
}

// 나쁜 예
if err != nil {
    return err
}
```

### 5. 로깅

```go
// 구조화된 로깅 사용
logger.Info().
    Str("user_id", userID).
    Str("action", "user_created").
    Msg("User created successfully")

// 에러 로깅
logger.Error().
    Err(err).
    Str("user_id", userID).
    Msg("Failed to create user")
```

## 🔧 새로운 기능 추가하기

### 1. 모델 정의

`internal/model/` 디렉토리에 새로운 모델을 정의합니다:

```go
// internal/model/example.go
package model

import (
    "time"
    "github.com/google/uuid"
)

type Example struct {
    ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
    Name      string    `json:"name" gorm:"not null"`
    CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
    UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}
```

### 2. 레포지토리 구현

`internal/repository/` 디렉토리에 데이터 접근 로직을 구현합니다:

```go
// internal/repository/example_repository.go
package repository

import (
    "github.com/Dongmoon29/code_racer/internal/model"
    "github.com/Dongmoon29/code_racer/internal/logger"
    "gorm.io/gorm"
)

type ExampleRepository struct {
    db     *gorm.DB
    logger logger.Logger
}

func NewExampleRepository(db *gorm.DB, logger logger.Logger) *ExampleRepository {
    return &ExampleRepository{
        db:     db,
        logger: logger,
    }
}

func (r *ExampleRepository) Create(example *model.Example) error {
    r.logger.Info().Str("name", example.Name).Msg("Creating example")
    return r.db.Create(example).Error
}

func (r *ExampleRepository) FindByID(id uuid.UUID) (*model.Example, error) {
    var example model.Example
    err := r.db.Where("id = ?", id).First(&example).Error
    if err != nil {
        return nil, err
    }
    return &example, nil
}
```

### 3. 서비스 구현

`internal/service/` 디렉토리에 비즈니스 로직을 구현합니다:

```go
// internal/service/example_service.go
package service

import (
    "github.com/Dongmoon29/code_racer/internal/model"
    "github.com/Dongmoon29/code_racer/internal/repository"
    "github.com/Dongmoon29/code_racer/internal/logger"
)

type ExampleService struct {
    repo   repository.ExampleRepository
    logger logger.Logger
}

func NewExampleService(repo repository.ExampleRepository, logger logger.Logger) *ExampleService {
    return &ExampleService{
        repo:   repo,
        logger: logger,
    }
}

func (s *ExampleService) CreateExample(name string) (*model.Example, error) {
    s.logger.Info().Str("name", name).Msg("Creating example in service")

    example := &model.Example{
        Name: name,
    }

    if err := s.repo.Create(example); err != nil {
        s.logger.Error().Err(err).Msg("Failed to create example")
        return nil, err
    }

    return example, nil
}
```

### 4. 컨트롤러 구현

`internal/controller/` 디렉토리에 HTTP 핸들러를 구현합니다:

```go
// internal/controller/example_controller.go
package controller

import (
    "net/http"
    "github.com/Dongmoon29/code_racer/internal/service"
    "github.com/Dongmoon29/code_racer/internal/logger"
    "github.com/gin-gonic/gin"
)

type ExampleController struct {
    service *service.ExampleService
    logger  logger.Logger
}

func NewExampleController(service *service.ExampleService, logger logger.Logger) *ExampleController {
    return &ExampleController{
        service: service,
        logger:  logger,
    }
}

func (c *ExampleController) CreateExample(ctx *gin.Context) {
    var req struct {
        Name string `json:"name" binding:"required"`
    }

    if err := ctx.ShouldBindJSON(&req); err != nil {
        c.logger.Error().Err(err).Msg("Invalid request body")
        ctx.JSON(http.StatusBadRequest, gin.H{
            "success": false,
            "error": gin.H{
                "code":    "VALIDATION_ERROR",
                "message": "Invalid request body",
            },
        })
        return
    }

    example, err := c.service.CreateExample(req.Name)
    if err != nil {
        c.logger.Error().Err(err).Msg("Failed to create example")
        ctx.JSON(http.StatusInternalServerError, gin.H{
            "success": false,
            "error": gin.H{
                "code":    "INTERNAL_ERROR",
                "message": "Failed to create example",
            },
        })
        return
    }

    ctx.JSON(http.StatusCreated, gin.H{
        "success": true,
        "message": "Example created successfully",
        "data": gin.H{
            "example": example,
        },
    })
}
```

### 5. 라우터에 엔드포인트 추가

`internal/router/router.go`에 새로운 라우트를 추가합니다:

```go
// internal/router/router.go
func Setup(
    // ... 기존 의존성
    exampleController *controller.ExampleController,
    // ... 기타 의존성
) *gin.Engine {
    // ... 기존 코드

    // API 라우트 그룹
    api := router.Group("/api")
    {
        // ... 기존 라우트

        // Example 라우트
        example := api.Group("/examples")
        {
            example.POST("", exampleController.CreateExample)
            // 추가 라우트...
        }
    }

    return router
}
```

### 6. 의존성 초기화

`main.go`의 `initializeDependencies` 함수에 새로운 의존성을 추가합니다:

```go
func initializeDependencies(db *gorm.DB, rdb *redis.Client, cfg *config.Config, appLogger logger.Logger) *dependencies {
    // ... 기존 코드

    // Example 의존성 추가
    exampleRepository := repository.NewExampleRepository(db, appLogger)
    exampleService := service.NewExampleService(exampleRepository, appLogger)
    exampleController := controller.NewExampleController(exampleService, appLogger)

    return &dependencies{
        // ... 기존 의존성
        exampleController: exampleController,
    }
}
```

## 🧪 테스트 작성

### 1. 단위 테스트

각 패키지에 대한 테스트 파일을 작성합니다:

```go
// internal/service/example_service_test.go
package service

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

func TestExampleService_CreateExample(t *testing.T) {
    // Mock repository 생성
    mockRepo := &MockExampleRepository{}
    mockLogger := &MockLogger{}

    // Mock 설정
    mockRepo.On("Create", mock.AnythingOfType("*model.Example")).Return(nil)

    // Service 생성
    service := NewExampleService(mockRepo, mockLogger)

    // 테스트 실행
    example, err := service.CreateExample("test")

    // 검증
    assert.NoError(t, err)
    assert.NotNil(t, example)
    assert.Equal(t, "test", example.Name)

    // Mock 호출 검증
    mockRepo.AssertExpectations(t)
}
```

### 2. 통합 테스트

`internal/testutil/` 패키지를 사용하여 통합 테스트를 작성합니다:

```go
// internal/service/example_service_integration_test.go
package service

import (
    "testing"
    "github.com/Dongmoon29/code_racer/internal/testutil"
    "github.com/stretchr/testify/assert"
)

func TestExampleService_Integration(t *testing.T) {
    // 테스트 데이터베이스 설정
    db, cleanup := testutil.SetupTestDB(t)
    defer cleanup()

    // Repository 및 Service 생성
    repo := repository.NewExampleRepository(db, testutil.NewTestLogger())
    service := NewExampleService(repo, testutil.NewTestLogger())

    // 테스트 실행
    example, err := service.CreateExample("integration_test")

    // 검증
    assert.NoError(t, err)
    assert.NotNil(t, example)

    // 데이터베이스에서 실제로 저장되었는지 확인
    var savedExample model.Example
    err = db.Where("id = ?", example.ID).First(&savedExample).Error
    assert.NoError(t, err)
    assert.Equal(t, "integration_test", savedExample.Name)
}
```

### 3. 테스트 실행

```bash
# 전체 테스트 실행
go test ./...

# 특정 패키지 테스트
go test ./internal/service

# 테스트 커버리지 확인
go test -cover ./...

# 벤치마크 테스트
go test -bench=. ./internal/service
```

## 🔍 디버깅

### 1. 로그 레벨 설정

개발 환경에서는 DEBUG 레벨로 설정하여 상세한 로그를 확인할 수 있습니다:

```go
if !isProduction() {
    zerolog.SetGlobalLevel(zerolog.DebugLevel)
}
```

### 2. 구조화된 로깅

```go
logger.Debug().
    Str("user_id", userID).
    Str("action", "login_attempt").
    Str("ip", clientIP).
    Msg("User login attempt")
```

### 3. 에러 추적

```go
logger.Error().
    Err(err).
    Str("function", "CreateUser").
    Str("user_email", email).
    Msg("Failed to create user")
```

## 📊 성능 최적화

### 1. 데이터베이스 쿼리 최적화

```go
// N+1 문제 방지
func (r *UserRepository) GetUsersWithGames() ([]model.User, error) {
    var users []model.User
    err := r.db.Preload("Games").Find(&users).Error
    return users, err
}

// 인덱스 활용
func (r *UserRepository) GetUserByEmail(email string) (*model.User, error) {
    var user model.User
    err := r.db.Where("email = ?", email).First(&user).Error
    return &user, err
}
```

### 2. Redis 캐싱

```go
func (s *UserService) GetUserProfile(userID uuid.UUID) (*model.User, error) {
    // 캐시에서 먼저 확인
    cacheKey := fmt.Sprintf("user_profile:%s", userID)
    if cached, err := s.redis.Get(context.Background(), cacheKey).Result(); err == nil {
        var user model.User
        if err := json.Unmarshal([]byte(cached), &user); err == nil {
            return &user, nil
        }
    }

    // 데이터베이스에서 조회
    user, err := s.repo.FindByID(userID)
    if err != nil {
        return nil, err
    }

    // 캐시에 저장
    if userData, err := json.Marshal(user); err == nil {
        s.redis.Set(context.Background(), cacheKey, userData, time.Hour)
    }

    return user, nil
}
```

## 🚀 배포

### 1. 환경별 설정

```go
// config/config.go
type Config struct {
    Environment string
    // ... 기타 설정
}

func LoadConfig() (*Config, error) {
    config := &Config{
        Environment: getEnv("ENVIRONMENT", "development"),
    }

    switch config.Environment {
    case "production":
        // 프로덕션 설정
    case "staging":
        // 스테이징 설정
    default:
        // 개발 설정
    }

    return config, nil
}
```

### 2. Docker 이미지 빌드

```dockerfile
# Dockerfile
FROM golang:1.24-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main cmd/api/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
CMD ["./main"]
```

### 3. 환경 변수 관리

```bash
# .env.production
ENVIRONMENT=production
DB_HOST=production-db-host
DB_PASSWORD=production-password
JWT_SECRET=production-jwt-secret
```

## 🔒 보안

### 1. 입력 검증

```go
func (c *UserController) CreateUser(ctx *gin.Context) {
    var req CreateUserRequest
    if err := ctx.ShouldBindJSON(&req); err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
        return
    }

    // 추가 검증
    if len(req.Password) < 8 {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": "Password too short"})
        return
    }
}
```

### 2. SQL 인젝션 방지

GORM을 사용하여 자동으로 SQL 인젝션을 방지합니다:

```go
// 안전한 쿼리
err := db.Where("email = ?", email).First(&user).Error

// 위험한 쿼리 (사용하지 말 것)
err := db.Raw(fmt.Sprintf("SELECT * FROM users WHERE email = '%s'", email)).Scan(&user).Error
```

### 3. CORS 설정

```go
router.Use(cors.New(cors.Config{
    AllowOrigins:     []string{allowedOrigin},
    AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
    AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
    AllowCredentials: true,
}))
```

## 📚 유용한 리소스

### Go 관련

- [Go 공식 문서](https://golang.org/doc/)
- [Go by Example](https://gobyexample.com/)
- [Effective Go](https://golang.org/doc/effective_go.html)

### 프레임워크 관련

- [Gin 문서](https://gin-gonic.com/docs/)
- [GORM 문서](https://gorm.io/docs/)
- [Zerolog 문서](https://github.com/rs/zerolog)

### 테스트 관련

- [Testify 문서](https://github.com/stretchr/testify)
- [Go 테스트 가이드](https://golang.org/pkg/testing/)

## 🤝 기여 가이드

### 1. 이슈 리포트

버그를 발견했거나 새로운 기능을 제안하고 싶다면:

1. GitHub 이슈를 생성하세요
2. 명확한 제목과 설명을 작성하세요
3. 재현 단계를 포함하세요

### 2. 풀 리퀘스트

1. Fork the repository
2. Feature branch 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. Branch 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

### 3. 코드 리뷰

모든 PR은 코드 리뷰를 거쳐야 합니다:

- 테스트가 통과해야 합니다
- 코드 스타일 가이드를 따라야 합니다
- 문서가 업데이트되어야 합니다

## 📞 문의

개발 관련 질문이나 제안사항이 있으시면:

1. GitHub 이슈를 생성하세요
2. 프로젝트 팀원에게 연락하세요
3. 문서를 확인하세요
