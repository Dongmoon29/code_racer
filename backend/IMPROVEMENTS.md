# 백엔드 코드 개선 사항

이 문서는 백엔드 코드 리뷰를 통해 발견된 개선 사항들을 정리한 것입니다.

## 🔴 Critical (즉시 수정 필요)

### 1. ✅ 로그 레벨 버그 수정 완료

**위치**: `cmd/api/main.go:45`
**문제**: 프로덕션 모드에서도 `DebugLevel`로 설정되어 있어 민감한 정보가 로그에 노출될 수 있음
**수정**: `zerolog.InfoLevel`로 변경 완료

## 🟡 High Priority (우선순위 높음)

### 2. OAuth 설정 중복 제거

**위치**:

- `internal/controller/auth_controller.go:53-64` (Google)
- `internal/controller/auth_controller.go:67-78` (GitHub)
- `internal/service/auth_service.go:196-205` (Google)
- `internal/service/auth_service.go:276-285` (GitHub)

**문제**: OAuth 설정이 컨트롤러와 서비스에 중복되어 있음
**개선 방안**:

- OAuth 설정을 `config` 패키지로 이동하여 중앙화
- 또는 `OAuthConfigProvider` 인터페이스를 서비스에서도 사용

**권장 수정**:

```go
// config/oauth.go
type OAuthConfig struct {
    Google *oauth2.Config
    GitHub *oauth2.Config
}

func LoadOAuthConfig() (*OAuthConfig, error) {
    // 환경 변수에서 로드
}
```

### 3. 에러 처리 개선

**위치**: 여러 곳

**문제점**:

- `internal/config/redis.go:34` - Redis 연결 실패 시 로그 메시지가 한국어로 되어 있음
- 일부 에러가 제대로 로깅되지 않음
- 에러 메시지가 사용자에게 노출될 때 보안 정보가 포함될 수 있음

**개선 방안**:

- 모든 에러 메시지를 영어로 통일
- 에러 로깅 시 컨텍스트 정보 추가
- 사용자에게 노출되는 에러 메시지와 내부 로그 메시지 분리

### 4. 보안 개선

#### 4.1 State 파라미터 검증 강화

**위치**: `internal/controller/auth_controller.go:302-304`
**문제**: State 검증이 너무 단순함 (길이만 체크)
**개선**: CSRF 토큰을 사용한 실제 검증 로직 추가

#### 4.2 JWT Secret 검증

**위치**: `internal/config/config.go:83-87`
**문제**: JWT Secret이 비어있거나 너무 짧은 경우 검증 없음
**개선**: 최소 길이 및 복잡도 검증 추가

#### 4.3 CORS 설정

**위치**: `internal/router/router.go:52`
**문제**: `AllowCredentials: false`로 설정되어 있지만, 쿠키를 사용하는 경우 `true`로 변경 필요
**개선**: 환경에 따라 동적으로 설정

### 5. 데이터베이스 쿼리 최적화

#### 5.1 Leaderboard 쿼리 최적화

**위치**: `internal/repository/user_repository.go:101-123`
**문제**: `EXISTS` 서브쿼리가 비효율적일 수 있음
**개선 방안**:

```sql
-- 현재
WHERE EXISTS (SELECT 1 FROM matches m1 WHERE ...)
   OR EXISTS (SELECT 1 FROM matches m2 WHERE ...)

-- 개선안
WHERE id IN (
    SELECT DISTINCT player_a_id FROM matches WHERE mode = 'ranked_pvp'
    UNION
    SELECT DISTINCT player_b_id FROM matches WHERE mode = 'ranked_pvp' AND player_b_id IS NOT NULL
)
```

또는 JOIN을 사용:

```sql
SELECT DISTINCT u.* FROM users u
INNER JOIN matches m ON (u.id = m.player_a_id OR u.id = m.player_b_id)
WHERE m.mode = 'ranked_pvp'
ORDER BY u.rating DESC
```

## 🟢 Medium Priority (중간 우선순위)

### 6. 코드 구조 개선

#### 6.1 매직 넘버 상수화

**위치**: 여러 곳
**문제**: 하드코딩된 값들이 많음

- `internal/service/auth_service.go:28` - `tokenExpiryDays = 7`
- `internal/service/websocket_service.go:26` - `pongWait = 60 * time.Second`
- `internal/controller/auth_controller.go:132` - 쿠키 만료 시간 `3600*24*7`

**개선**: 설정 파일이나 상수로 관리

#### 6.2 에러 타입 정의

**위치**: 전체
**문제**: `errors.New()`로 생성된 일반 에러만 사용
**개선**: 커스텀 에러 타입 정의

```go
type ErrUserNotFound struct {
    UserID uuid.UUID
}

func (e *ErrUserNotFound) Error() string {
    return fmt.Sprintf("user not found: %s", e.UserID)
}
```

#### 6.3 컨텍스트 전파

**위치**: 여러 서비스 함수
**문제**: `context.Context`를 파라미터로 받지 않음
**개선**: 모든 외부 호출(DB, Redis, HTTP)에 `context.Context` 추가

### 7. 테스트 커버리지

**현재 상태**: 일부 테스트 파일이 있지만 커버리지 확인 필요
**개선 방안**:

- 테스트 커버리지 측정 및 목표 설정 (예: 80% 이상)
- 통합 테스트 추가
- WebSocket 서비스 테스트 강화

### 8. 로깅 개선

#### 8.1 구조화된 로깅 일관성

**위치**: 전체
**문제**: 일부 로그가 구조화되지 않음
**개선**: 모든 로그를 구조화된 형식으로 통일

#### 8.2 민감 정보 로깅 방지

**위치**:

- `internal/controller/auth_controller.go:197` - 코드 일부 로깅
- `internal/middleware/auth_middleware.go:39` - 토큰 일부 로깅

**개선**: 민감 정보는 마스킹하거나 로깅하지 않음

### 9. 성능 개선

#### 9.1 Redis 연결 풀 설정

**위치**: `internal/config/redis.go:14-26`
**문제**: 연결 풀 설정이 없음
**개선**:

```go
options := &redis.Options{
    Addr: cfg.RedisHost + ":" + cfg.RedisPort,
    PoolSize:     10,
    MinIdleConns: 5,
    MaxRetries:   3,
    // ...
}
```

#### 9.2 데이터베이스 연결 풀 설정

**위치**: `internal/config/database.go:84-86`
**문제**: GORM 기본 설정만 사용
**개선**: 명시적인 연결 풀 설정 추가

#### 9.3 랜덤 문제 선택 알고리즘

**위치**: `internal/service/match_service.go:428`
**문제**: `time.Now().UnixNano() % int64(len(problems))`는 균등 분포가 아님
**개선**: `crypto/rand` 사용

### 10. 코드 품질

#### 10.1 주석 및 문서화

**위치**: 전체
**문제**: 일부 함수에 godoc 주석이 없음
**개선**: 모든 exported 함수에 godoc 주석 추가

#### 10.2 함수 길이

**위치**:

- `internal/service/websocket_service.go:1064-1132` - `readPump` 함수가 너무 김
- `internal/service/match_service.go:76-201` - `SubmitSolution` 함수가 너무 김

**개선**: 함수를 더 작은 단위로 분리

#### 10.3 중복 코드 제거

**위치**:

- `internal/middleware/auth_middleware.go:26-98`와 `100-131` - 인증 로직 중복
- OAuth 콜백 핸들러들

**개선**: 공통 로직 추출

## 📝 TODO 항목

코드베이스에 남아있는 TODO 항목들:

1. `internal/repository/user_repository.go:101` - Leaderboard 쿼리 최적화
2. `internal/controller/match_controller.go:66` - 로그 변경에 따른 코드 수정 필요

## 🔍 추가 권장 사항

### 1. 메트릭 수집

- Prometheus 메트릭 추가 (요청 수, 응답 시간, 에러율 등)
- 비즈니스 메트릭 (매칭 성공률, 게임 완료율 등)

### 2. 헬스 체크 개선

**위치**: `internal/router/router.go:31-35`
**현재**: 단순 상태만 반환
**개선**: 데이터베이스, Redis 연결 상태 확인 추가

### 3. Rate Limiting

- API 엔드포인트에 rate limiting 추가
- WebSocket 연결 수 제한

### 4. Graceful Shutdown 개선

**위치**: `cmd/api/main.go:266-291`
**현재**: 기본적인 graceful shutdown만 구현
**개선**:

- 진행 중인 요청 완료 대기
- WebSocket 연결 정리
- Redis 연결 정리

### 5. 환경 변수 검증 강화

**위치**: `internal/config/config.go:36-106`
**개선**:

- 타입 검증 (포트 번호 범위 등)
- URL 형식 검증
- 필수/선택적 환경 변수 명확히 구분

## 실행 계획

1. ✅ Critical 버그 수정 (로그 레벨)
2. 🔄 High Priority 항목들 순차적으로 처리
3. Medium Priority 항목들은 리팩토링 시점에 함께 처리

## 참고

이 개선 사항들은 점진적으로 적용하는 것을 권장합니다. 각 변경사항마다 테스트를 작성하고, 코드 리뷰를 거친 후 적용하세요.
