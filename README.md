# CodeRacer

[English](README.md) | [한국어](README.ko.md)

CodeRacer is a real-time coding competition platform where you can improve your skills and compete with friends by solving coding problems together.

## Key Features

- Real-time coding competitions
- Multiple programming language support (JavaScript, Python, Go, Rust)
- LeetCode-style problem solving (TBD)
- Real-time code evaluation system
- Progress monitoring through dashboard (TBD)

## Tech Stack

### Frontend

- Next.js 15.2
- React 19
- TypeScript
- TailwindCSS
- CodeMirror 6
- Zustand (State Management)
- WebSocket

### Backend

- Go 1.20
- Gin Web Framework
- GORM
- PostgreSQL
- Redis
- WebSocket
- JWT Authentication

## Getting Started

### Prerequisites

- Node.js 18+
- Go 1.20+
- Docker & Docker Compose
- PostgreSQL 14
- Redis 7

### Local Development Setup

1. Clone the repository

```bash
git clone https://github.com/Dongmoon29/code_racer.git
cd code_racer
```

2. Set up environment variables

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

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Redis Configuration
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

3. Start the databases

```bash
docker-compose up postgres redis
```

4. Run the backend

```bash
cd backend
go mod download
go run cmd/api/main.go
```

5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

For detailed GCP deployment guide, refer to [deployment/README.md](deployment/README.md).

## Project Structure

```
.
├── backend/
│   ├── cmd/
│   │   └── api/
│   │       └── main.go
│   ├── internal/
│   │   ├── config/
│   │   │   ├── config.go
│   │   │   ├── database.go
│   │   │   └── dependencies.go
│   │   ├── controller/
│   │   │   ├── auth_controller.go
│   │   │   ├── game_controller.go
│   │   │   └── user_controller.go
│   │   ├── logger/
│   │   │   └── zerolog.go
│   │   ├── middleware/
│   │   │   ├── auth.go
│   │   │   └── cors.go
│   │   ├── model/
│   │   │   ├── auth.go
│   │   │   ├── game.go
│   │   │   └── user.go
│   │   ├── repository/
│   │   │   ├── game_repository.go
│   │   │   ├── leetcode_repository.go
│   │   │   └── user_repository.go
│   │   ├── service/
│   │   │   ├── auth_service.go
│   │   │   ├── game_service.go
│   │   │   ├── judge_service.go
│   │   │   ├── user_service.go
│   │   │   └── websocket_service.go
│   │   └── util/
│   │       └── env.go
│   ├── migrations/
│   │   └── *.sql
│   ├── .env.example
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── go.mod
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── game/
│   │   │   └── shared/
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useWebSocket.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── websocket.ts
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── game/
│   │   │   └── _app.tsx
│   │   ├── stores/
│   │   │   ├── authStore.ts
│   │   │   └── gameStore.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── .env.example
│   ├── Dockerfile
│   ├── next.config.ts
│   └── package.json
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
├── deployment/
│   └── README.md
├── docker-compose.yml
├── README.md
└── README.ko.md
```

## Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

Project Link: [https://github.com/Dongmoon29/code_racer](https://github.com/Dongmoon29/code_racer)

For detailed documentation on project code base, refer to [https://app.komment.ai/wiki/github/Dongmoon29/code_racer?branch=main&version=1](https://app.komment.ai/wiki/github/Dongmoon29/code_racer?branch=main&version=1).
