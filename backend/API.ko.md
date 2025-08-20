# Code Racer API 문서

[한국어](API.ko.md) | [English](API.md)

## 개요

Code Racer 백엔드 API는 실시간 코딩 대결 게임을 위한 RESTful API와 WebSocket 엔드포인트를 제공합니다.

## 기본 정보

- **Base URL**: `http://localhost:8080` (개발 환경)
- **API 버전**: v1
- **인증 방식**: JWT Bearer Token
- **응답 형식**: JSON

## 인증

### JWT 토큰 사용

API 요청 시 Authorization 헤더에 JWT 토큰을 포함해야 합니다:

```
Authorization: Bearer <your_jwt_token>
```

### 토큰 획득

1. `/api/auth/register` 또는 `/api/auth/login`으로 로그인
2. 응답에서 `token` 필드의 값을 사용

## API 엔드포인트

### 1. 인증 (Authentication)

#### 사용자 등록

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**응답 (200)**:

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "created_at": "timestamp"
    },
    "token": "jwt_token_string"
  }
}
```

#### 사용자 로그인

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "string",
  "password": "string"
}
```

**응답 (200)**:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string"
    },
    "token": "jwt_token_string"
  }
}
```

#### 로그아웃

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**응답 (200)**:

```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### OAuth 인증

##### Google OAuth

```http
GET /api/auth/google
```

사용자를 Google OAuth 페이지로 리다이렉트합니다.

##### Google OAuth 콜백

```http
GET /api/auth/google/callback?code=<authorization_code>
```

**응답 (200)**:

```json
{
  "success": true,
  "message": "Google OAuth successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string"
    },
    "token": "jwt_token_string"
  }
}
```

##### GitHub OAuth

```http
GET /api/auth/github
```

사용자를 GitHub OAuth 페이지로 리다이렉트합니다.

##### GitHub OAuth 콜백

```http
GET /api/auth/github/callback?code=<authorization_code>
```

**응답 (200)**:

```json
{
  "success": true,
  "message": "GitHub OAuth successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string"
    },
    "token": "jwt_token_string"
  }
}
```

#### 토큰 교환

```http
POST /api/auth/exchange-token
Content-Type: application/json

{
  "code": "authorization_code",
  "provider": "google|github"
}
```

**응답 (200)**:

```json
{
  "success": true,
  "message": "Token exchange successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "profile_image": "string"
    },
    "token": "jwt_token_string"
  }
}
```

### 2. 게임 (Games)

#### 게임 목록 조회

```http
GET /api/games
Authorization: Bearer <token>
Query Parameters:
  - status: string (optional) - 게임 상태 필터 (waiting, playing, finished)
  - page: int (optional) - 페이지 번호 (기본값: 1)
  - limit: int (optional) - 페이지당 항목 수 (기본값: 10)
```

**응답 (200)**:

```json
{
  "success": true,
  "data": {
    "games": [
      {
        "id": "uuid",
        "title": "string",
        "status": "waiting|playing|finished",
        "created_by": "uuid",
        "created_at": "timestamp",
        "max_players": 2,
        "current_players": 1,
        "problem": {
          "id": "uuid",
          "title": "string",
          "difficulty": "easy|medium|hard"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "total_pages": 3
    }
  }
}
```

#### 새 게임 생성

```http
POST /api/games
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "problem_id": "uuid",
  "max_players": 2
}
```

**응답 (201)**:

```json
{
  "success": true,
  "message": "Game created successfully",
  "data": {
    "game": {
      "id": "uuid",
      "title": "string",
      "status": "waiting",
      "created_by": "uuid",
      "created_at": "timestamp",
      "max_players": 2,
      "current_players": 1,
      "problem": {
        "id": "uuid",
        "title": "string",
        "difficulty": "easy|medium|hard"
      }
    }
  }
}
```

#### 게임 정보 조회

```http
GET /api/games/{id}
Authorization: Bearer <token>
```

**응답 (200)**:

```json
{
  "success": true,
  "data": {
    "game": {
      "id": "uuid",
      "title": "string",
      "status": "waiting|playing|finished",
      "created_by": "uuid",
      "created_at": "timestamp",
      "max_players": 2,
      "current_players": 1,
      "players": [
        {
          "id": "uuid",
          "username": "string",
          "joined_at": "timestamp"
        }
      ],
      "problem": {
        "id": "uuid",
        "title": "string",
        "description": "string",
        "difficulty": "easy|medium|hard",
        "examples": [
          {
            "input": "string",
            "output": "string",
            "explanation": "string"
          }
        ],
        "constraints": ["string"],
        "starter_code": {
          "python": "string",
          "javascript": "string",
          "java": "string"
        }
      }
    }
  }
}
```

#### 게임 참가

```http
POST /api/games/{id}/join
Authorization: Bearer <token>
```

**응답 (200)**:

```json
{
  "success": true,
  "message": "Successfully joined the game",
  "data": {
    "game": {
      "id": "uuid",
      "status": "playing",
      "current_players": 2
    }
  }
}
```

#### 솔루션 제출

```http
POST /api/games/{id}/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "string",
  "language": "python|javascript|java|go|rust|cpp"
}
```

**응답 (200)**:

```json
{
  "success": true,
  "message": "Solution submitted successfully",
  "data": {
    "submission": {
      "id": "uuid",
      "status": "pending|accepted|wrong_answer|time_limit_exceeded|runtime_error",
      "execution_time": "float",
      "memory_used": "int",
      "test_cases_passed": "int",
      "total_test_cases": "int"
    }
  }
}
```

#### 게임 종료

```http
POST /api/games/{id}/close
Authorization: Bearer <token>
```

**응답 (200)**:

```json
{
  "success": true,
  "message": "Game closed successfully"
}
```

### 3. 사용자 (Users)

#### 현재 사용자 정보

```http
GET /api/users/me
Authorization: Bearer <token>
```

**응답 (200)**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "avatar_url": "string",
      "created_at": "timestamp",
      "stats": {
        "total_games": 10,
        "games_won": 6,
        "games_lost": 4,
        "win_rate": 0.6
      }
    }
  }
}
```

#### 사용자 프로필 조회

```http
GET /api/users/{userId}/profile
Authorization: Bearer <token>
```

**응답 (200)**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "avatar_url": "string",
      "created_at": "timestamp",
      "stats": {
        "total_games": 15,
        "games_won": 9,
        "games_lost": 6,
        "win_rate": 0.6
      }
    }
  }
}
```

#### 프로필 업데이트

```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "string",
  "avatar_url": "string"
}
```

**응답 (200)**:

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "avatar_url": "string",
      "updated_at": "timestamp"
    }
  }
}
```

### 4. LeetCode 문제 (Admin Only)

#### 문제 목록 조회

```http
GET /api/leetcode
Authorization: Bearer <token>
Query Parameters:
  - difficulty: string (optional) - 난이도 필터 (easy, medium, hard)
  - page: int (optional) - 페이지 번호
  - limit: int (optional) - 페이지당 항목 수
```

**응답 (200)**:

```json
{
  "success": true,
  "data": {
    "problems": [
      {
        "id": "uuid",
        "title": "string",
        "difficulty": "easy|medium|hard",
        "description": "string",
        "created_at": "timestamp"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "total_pages": 5
    }
  }
}
```

#### 문제 상세 조회

```http
GET /api/leetcode/{id}
Authorization: Bearer <token>
```

**응답 (200)**:

```json
{
  "success": true,
  "data": {
    "problem": {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "difficulty": "easy|medium|hard",
      "examples": [
        {
          "input": "string",
          "output": "string",
          "explanation": "string"
        }
      ],
      "constraints": ["string"],
      "starter_code": {
        "python": "string",
        "javascript": "string",
        "java": "string"
      },
      "test_cases": [
        {
          "input": "string",
          "output": "string"
        }
      ],
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  }
}
```

#### 새 문제 생성 (Admin Only)

```http
POST /api/leetcode
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "difficulty": "easy|medium|hard",
  "examples": [
    {
      "input": "string",
      "output": "string",
      "explanation": "string"
    }
  ],
  "constraints": ["string"],
  "starter_code": {
    "python": "string",
    "javascript": "string",
    "java": "string"
  },
  "test_cases": [
    {
      "input": "string",
      "output": "string"
    }
  ]
}
```

**응답 (201)**:

```json
{
  "success": true,
  "message": "Problem created successfully",
  "data": {
    "problem": {
      "id": "uuid",
      "title": "string",
      "difficulty": "easy|medium|hard",
      "created_at": "timestamp"
    }
  }
}
```

#### 문제 수정 (Admin Only)

```http
PUT /api/leetcode/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "string",
  "description": "string",
  "difficulty": "easy|medium|hard",
  "examples": [...],
  "constraints": [...],
  "starter_code": {...},
  "test_cases": [...]
}
```

**응답 (200)**:

```json
{
  "success": true,
  "message": "Problem updated successfully",
  "data": {
    "problem": {
      "id": "uuid",
      "title": "string",
      "updated_at": "timestamp"
    }
  }
}
```

#### 문제 삭제 (Admin Only)

```http
DELETE /api/leetcode/{id}
Authorization: Bearer <token>
```

**응답 (200)**:

```json
{
  "success": true,
  "message": "Problem deleted successfully"
}
```

### 5. WebSocket

#### 실시간 게임 통신

```http
GET /ws/{gameId}
Authorization: Bearer <token>
```

WebSocket 연결을 통해 실시간 게임 이벤트를 수신합니다.

**인증 방법**:
1. **Authorization 헤더** (권장): `Authorization: Bearer <token>`
2. **쿼리 파라미터** (대체): `?token=<jwt_token>`

**연결 예시**:
```javascript
// JavaScript
const ws = new WebSocket('wss://domain/ws/game-id', {
  headers: { Authorization: 'Bearer your-token' }
});

// 또는 쿼리 파라미터 사용
const ws = new WebSocket('wss://domain/ws/game-id?token=your-token');
```

**이벤트 타입**:

1. **코드 업데이트** (실시간 동기화):

```json
{
  "type": "code_update",
  "data": {
    "user_id": "uuid",
    "code": "string",
    "language": "javascript|python|go|rust|java|cpp",
    "updated_at": "timestamp"
  }
}
```

2. **게임 시작**:

```json
{
  "type": "game_start",
  "data": {
    "game_id": "uuid",
    "started_at": "timestamp",
    "players": [
      {
        "id": "uuid",
        "username": "string",
        "profile_image": "string"
      }
    ]
  }
}
```

3. **게임 종료**:

```json
{
  "type": "game_end",
  "data": {
    "game_id": "uuid",
    "winner_id": "uuid",
    "reason": "completion|timeout|disconnection",
    "ended_at": "timestamp"
  }
}
```

4. **Ping/Pong** (연결 상태 확인):

```json
{
  "type": "ping"
}
```

```json
{
  "type": "pong",
  "data": {
    "timestamp": "timestamp"
  }
}
```

**클라이언트에서 서버로 전송하는 메시지**:

```json
{
  "type": "code_update",
  "data": {
    "code": "string",
    "language": "string"
  }
}
```

## 에러 응답

### 일반적인 에러 형식

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  }
}
```

### HTTP 상태 코드

- **200**: 성공
- **201**: 생성됨
- **400**: 잘못된 요청
- **401**: 인증 실패
- **403**: 권한 없음
- **404**: 리소스를 찾을 수 없음
- **422**: 유효성 검사 실패
- **500**: 서버 내부 오류

### 일반적인 에러 코드

- `INVALID_CREDENTIALS`: 잘못된 로그인 정보
- `TOKEN_EXPIRED`: 토큰 만료
- `INSUFFICIENT_PERMISSIONS`: 권한 부족
- `VALIDATION_ERROR`: 입력 데이터 유효성 검사 실패
- `RESOURCE_NOT_FOUND`: 리소스를 찾을 수 없음
- `GAME_FULL`: 게임이 가득 참
- `GAME_ALREADY_STARTED`: 게임이 이미 시작됨

## 요청 제한

- **Rate Limiting**: 분당 100 요청
- **파일 업로드**: 최대 10MB
- **코드 제출**: 최대 100KB

## 예제

### Python 클라이언트 예제

```python
import requests
import json

BASE_URL = "http://localhost:8080"

# 로그인
def login(email, password):
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": email,
        "password": password
    })
    return response.json()["data"]["token"]

# 게임 목록 조회
def get_games(token):
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/games", headers=headers)
    return response.json()

# 사용 예제
token = login("user@example.com", "password")
games = get_games(token)
print(games)
```

### JavaScript 클라이언트 예제

```javascript
const BASE_URL = 'http://localhost:8080';

// 로그인
async function login(email, password) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  return data.data.token;
}

// 게임 목록 조회
async function getGames(token) {
  const response = await fetch(`${BASE_URL}/api/games`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

// 사용 예제
login('user@example.com', 'password')
  .then((token) => getGames(token))
  .then((games) => console.log(games));
```

---

이 API 문서는 Code Racer 백엔드와의 통합을 위한 포괄적인 정보를 제공하며, API가 발전함에 따라 지속적으로 업데이트됩니다.