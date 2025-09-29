# CodeRacer 🏁

**Real-time competitive coding platform** where developers race to solve programming challenges against each other.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/go-1.25-blue.svg)](https://golang.org/)
[![Node.js Version](https://img.shields.io/badge/node-20+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-blue.svg)](https://postgresql.org/)
[![Redis](https://img.shields.io/badge/cache-Redis-red.svg)](https://redis.io/)

## 🎯 Overview

CodeRacer is a real-time multiplayer coding platform that allows developers to compete against each other by solving algorithmic challenges. Players are automatically matched based on difficulty preference and race to solve coding problems in various programming languages.

### ✨ Key Features

- 🔥 **Real-time Competitions**: Live coding battles with instant opponent code visibility
- 🤖 **Automatic Matchmaking**: Smart player matching based on difficulty preferences
- 💻 **Multi-language Support**: Code in Python, JavaScript, Go, Java, and C++
- ⚡ **Live Code Execution**: Powered by Judge0 API for instant code evaluation
- 🎨 **Modern UI**: Responsive design with dark/light theme support
- 👤 **User Authentication**: Secure login with email/password, Google, and GitHub OAuth
- 📊 **Admin Panel**: LeetCode problem management system
- 🌐 **WebSocket Integration**: Real-time communication and game state synchronization

### 🏗️ Architecture

**Frontend (Next.js + TypeScript)**

- Modern React application with TypeScript
- Real-time WebSocket integration
- CodeMirror editor with syntax highlighting
- Tailwind CSS + Styled Components for styling
- Zustand for state management

**Backend (Go + Gin)**

- Clean architecture with dependency injection
- WebSocket-based real-time communication
- JWT authentication with OAuth integration
- Comprehensive testing suite
- Docker containerization

**Infrastructure**

- PostgreSQL for data persistence
- Redis for caching and session management
- Judge0 API for code execution
- Google Cloud Platform deployment
- Terraform for infrastructure as code

## 🚀 Quick Start

### Prerequisites

- [Go 1.25+](https://golang.org/doc/install)
- [Node.js 20+](https://nodejs.org/)
- [PostgreSQL 14+](https://www.postgresql.org/)
- [Redis 7+](https://redis.io/)
- [Docker](https://www.docker.com/) (optional)

### 1. Clone Repository

```bash
git clone https://github.com/Dongmoon29/code_racer.git
cd code_racer
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
go mod download

# Setup environment variables
cp env.example .env
# Edit .env with your configuration

# Start services with Docker
docker-compose up -d

# Run database migrations
go run cmd/api/main.go migrate

# Start the server
go run cmd/api/main.go
```

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application running! 🎉

## 🎮 How to Play

1. **Sign Up/Login**: Create an account or login with Google/GitHub
2. **Choose Difficulty**: Select Easy, Medium, or Hard challenges
3. **Get Matched**: Automatic matchmaking finds you an opponent
4. **Race to Code**: Solve the programming challenge faster than your opponent
5. **Win the Race**: First to submit working code wins!

## 📁 Project Structure

```
code_racer/
├── backend/                 # Go backend application
│   ├── cmd/api/            # Application entry point
│   ├── internal/           # Private application code
│   │   ├── config/         # Configuration management
│   │   ├── controller/     # HTTP handlers
│   │   ├── service/        # Business logic
│   │   ├── repository/     # Data access layer
│   │   ├── model/          # Data models
│   │   └── middleware/     # HTTP middleware
│   ├── migrations/         # Database migrations
│   └── docker-compose.yml  # Local development services
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Next.js pages
│   │   ├── lib/            # Utility functions
│   │   ├── hooks/          # Custom React hooks
│   │   └── stores/         # State management
│   └── public/             # Static assets
└── deployment/             # Infrastructure and deployment
    └── terraform/          # GCP infrastructure
```

## 🛠️ Development

### Backend Development

```bash
cd backend

# Run tests
go test ./...


# Generate mocks
mockgen -source=internal/interfaces/game_interfaces.go -destination=internal/mocks/game_mocks.go

# Database operations
go run cmd/api/main.go migrate
go run cmd/api/main.go seed
```

### Frontend Development

```bash
cd frontend

# Run development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Type checking
npx tsc --noEmit
```

### Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🔧 Configuration

### Backend Environment Variables

Key configuration options in `.env`:

```bash
# Database
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=code_racer
DB_PORT=5432

# Redis
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret

# Judge0 API
JUDGE0_API_KEY=your_rapidapi_key
JUDGE0_API_ENDPOINT=https://judge0-ce.p.rapidapi.com

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GH_CLIENT_ID=your_github_client_id
GH_CLIENT_SECRET=your_github_client_secret
```

See `backend/env.example` for complete configuration options.

### Docker Production Build

```bash
# Build backend image
cd backend
docker build -t coderacer-backend .

# Build frontend image
cd frontend
docker build -t coderacer-frontend .
```

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
go test ./...

# Run tests with coverage
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# Run specific test package
go test ./internal/service/
```

### Frontend Tests

```bash
cd frontend

# Run tests (when test framework is added)
npm test

# Type checking
npx tsc --noEmit
```

## 📊 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/github` - GitHub OAuth login

### Game Endpoints

- `GET /api/games` - List available games
- `POST /api/games` - Create new game
- `GET /api/games/:id` - Get game details
- `POST /api/games/:id/submit` - Submit code solution

### WebSocket Events

- `match_start` - Matchmaking begins
- `match_found` - Opponent found
- `game_start` - Game begins
- `code_update` - Real-time code sharing
- `game_end` - Game completed

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Tech Stack

### Frontend

- **Framework**: Next.js 15.2.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Styled Components
- **State Management**: Zustand
- **Editor**: CodeMirror 6
- **HTTP Client**: Axios
- **UI Components**: Radix UI + Lucide Icons

### Backend

- **Language**: Go 1.25
- **Framework**: Gin
- **Database**: PostgreSQL with GORM
- **Cache**: Redis
- **Authentication**: JWT + OAuth2
- **Code Execution**: Judge0 API
- **Testing**: Testify + Gomock

### Infrastructure

- **Containerization**: Docker
- **Cloud Platform**: Google Cloud Platform
- **Infrastructure**: Terraform
- **Database**: Cloud SQL (PostgreSQL)
- **Cache**: Upstash Redis
- **Container Registry**: Artifact Registry
- **Compute**: Cloud Run

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Judge0](https://judge0.com/) for code execution API
- [LeetCode](https://leetcode.com/) for inspiration
- [CodeMirror](https://codemirror.net/) for the code editor
- Open source community for amazing tools and libraries

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/Dongmoon29/code_racer/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Dongmoon29/code_racer/discussions)
- 📧 **Email**: [dongmoon29@gmail.com](mailto:dongmoon29@gmail.com)

---

**Made with ❤️ by Dongmoon29**

_Race your way to better coding skills! 🏁_
