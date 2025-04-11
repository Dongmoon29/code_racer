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

## Deployment

Deploy using Docker Compose:

```bash
docker-compose up -d
```

For detailed GCP deployment guide, refer to [deployment/README.md](deployment/README.md).

## Project Structure

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

## Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

Project Link: [https://github.com/Dongmoon29/code_racer](https://github.com/Dongmoon29/code_racer)
