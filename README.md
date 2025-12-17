# CodeRacer

Real-time competitive coding platform where developers race to solve programming challenges.

[![Go](https://img.shields.io/badge/Go-1.25.0-blue)](https://golang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0.9-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61dafb)](https://reactjs.org/)

## Features

- **Real-time Racing**: Live 1v1 coding competitions with instant opponent visibility
- **Auto Matchmaking**: FIFO-based matching by difficulty (Easy/Medium/Hard)
- **Multi-language**: Python, JavaScript, Go
- **Live Execution**: Judge0 API integration for instant code evaluation
- **Elo Rating System**: Competitive ranking system with rating updates after matches
- **OAuth**: Google and GitHub authentication
- **Vim Mode**: CodeMirror editor with Vim keybindings
- **Admin Panel**: Problem and user management

## Tech Stack

**Frontend**: Next.js 16 • React 19 • TypeScript • Tailwind CSS v4 • CodeMirror 6 • Zustand • TanStack Query

**Backend**: Go 1.25 • Gin • PostgreSQL • Redis • GORM • JWT • OAuth2 • WebSocket

**Infrastructure**: Docker • GCP Cloud Run • Cloud SQL • Terraform

## Quick Start

### Prerequisites

- Go 1.25.0+
- Node.js 20+
- PostgreSQL 14+
- Redis 7+
- Docker (optional)

### Backend

```bash
cd backend
go mod download
cp env.example .env          # Configure database, Redis, JWT, Judge0, OAuth
docker-compose up -d         # Start PostgreSQL & Redis
go run cmd/api/main.go migrate
go run cmd/api/main.go
```

### Frontend

```bash
cd frontend
npm install
npm run dev                  # Starts on http://localhost:3000
```

## Project Structure

```
backend/
├── cmd/api/              # Entry point
├── internal/
│   ├── controller/       # HTTP & WebSocket handlers
│   ├── service/          # Business logic (matchmaking, game, judge)
│   ├── repository/       # Data access
│   ├── model/            # Domain models
│   ├── middleware/       # Auth, CORS
│   └── router/           # Route management
└── migrations/           # Database migrations

frontend/
├── src/
│   ├── components/       # React components
│   ├── pages/            # Next.js pages
│   ├── lib/              # API clients, WebSocket, utilities
│   │   └── websocket/    # WebSocket base classes
│   ├── hooks/            # Custom hooks
│   ├── stores/           # Zustand state
│   ├── constants/        # Application constants
│   ├── types/            # TypeScript type definitions
│   └── contexts/         # React contexts
└── public/               # Static assets
```

## Development

```bash
# Backend tests
cd backend
go test ./...
go test -coverprofile=coverage.out ./...

# Frontend
cd frontend
npm run build
npm run lint
npx tsc --noEmit
```

## Configuration

Key environment variables (see `backend/env.example`):

```bash
# Database
DB_HOST=localhost
DB_NAME=code_racer
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT & OAuth
JWT_SECRET=your_secret
GOOGLE_CLIENT_ID=...
GH_CLIENT_ID=...

# Judge0
JUDGE0_API_KEY=your_rapidapi_key
```

## License

MIT License - see [LICENSE](LICENSE)

## Links

- [Issues](https://github.com/Dongmoon29/code_racer/issues)
