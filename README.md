# CodeRacer

[English](README.md) | [한국어](README.ko.md)

CodeRacer is a real-time coding competition platform where you can improve your skills and compete with friends by solving coding problems together.

## Key Features

- **Real-time Coding Battles**: WebSocket-based real-time multiplayer games
- **Multiple Programming Languages**: JavaScript, Python, Go, Rust, Java, C++
- **Advanced Code Editor**: CodeMirror 6 with Vim mode support and syntax highlighting
- **Theme System**: Dark/Light mode with neon effect UI
- **LeetCode-style Problems**: Real coding interview problem solving
- **Real-time Code Evaluation**: Judge0 API-based automatic grading system
- **OAuth Authentication**: Google and GitHub social login support
- **Responsive Design**: Mobile and desktop optimized

## Tech Stack

### Frontend

- Next.js 15.2
- React 18.3
- TypeScript
- TailwindCSS 4
- CodeMirror 6 (with Vim mode support)
- Zustand (State Management)
- WebSocket (Real-time communication)
- Radix UI (Accessibility components)
- next-themes (Theme system)

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

## 📖 Documentation

### Development Guides
- **Backend Development**: [Korean](backend/DEVELOPMENT.md) | [English](backend/DEVELOPMENT.en.md)
- **Frontend Development**: [Korean](frontend/DEVELOPMENT.md) | [English](frontend/DEVELOPMENT.en.md)

### API Documentation
- **REST API**: [Korean](backend/API.md) | [English](backend/API.en.md)
- **WebSocket Setup**: [Korean](backend/WEBSOCKET_SETUP.md) | [English](backend/WEBSOCKET_SETUP.en.md)

### Deployment Guide
- **GCP Deployment**: [deployment/README.md](deployment/README.md)

## Project Structure

```
.
├── backend/                      # Go backend server
│   ├── cmd/api/                 # Application entry point
│   │   └── main.go
│   ├── internal/                # Internal packages
│   │   ├── config/             # Configuration (DB, Redis, JWT)
│   │   ├── controller/         # HTTP handlers
│   │   │   ├── auth_controller.go      # Authentication (login/register/OAuth)
│   │   │   ├── game_controller.go      # Game management
│   │   │   ├── user_controller.go      # User management
│   │   │   └── websocket_controller.go # WebSocket connections
│   │   ├── service/            # Business logic
│   │   │   ├── auth_service.go         # JWT, OAuth processing
│   │   │   ├── game_service.go         # Game state management
│   │   │   ├── judge_service.go        # Code evaluation
│   │   │   ├── user_service.go         # User management
│   │   │   └── websocket_service.go    # Real-time communication
│   │   ├── repository/         # Data access layer
│   │   ├── model/              # Data models
│   │   ├── middleware/         # Auth, CORS middleware
│   │   ├── judge/              # Judge0 API integration
│   │   ├── interfaces/         # Interface definitions
│   │   ├── types/              # Type definitions
│   │   ├── util/               # Utility functions
│   │   └── logger/             # Logging configuration
│   ├── migrations/              # Database migrations
│   ├── deployment/              # Deployment files (Terraform)
│   └── docker-compose.yml       # Development environment
├── frontend/                     # Next.js frontend
│   ├── src/
│   │   ├── pages/              # Page routing
│   │   │   ├── index.tsx               # Home page
│   │   │   ├── login.tsx               # Login page
│   │   │   ├── dashboard.tsx           # Dashboard
│   │   │   └── game/[id].tsx           # Game room
│   │   ├── components/         # React components
│   │   │   ├── game/                   # Game-related components
│   │   │   │   ├── CodeEditor.tsx      # CodeMirror 6 editor
│   │   │   │   ├── GameRoom.tsx        # Game room management
│   │   │   │   ├── RoomList.tsx        # Game room list
│   │   │   │   └── states/             # Game state UI
│   │   │   ├── auth/                   # Authentication related
│   │   │   ├── layout/                 # Layout components
│   │   │   └── ui/                     # Reusable UI components
│   │   ├── lib/                # Library configuration
│   │   │   ├── api.ts                  # API client
│   │   │   ├── websocket.ts            # WebSocket client
│   │   │   ├── language-support.ts     # Language editor settings
│   │   │   └── editor-theme.ts         # Editor themes
│   │   ├── stores/             # Zustand state management
│   │   │   └── authStore.ts
│   │   ├── hooks/              # Custom React hooks
│   │   │   └── useAuth.ts
│   │   └── styles/             # Stylesheets
│   │       └── globals.css             # Global CSS, theme system
│   ├── public/                  # Static files
│   ├── components.json          # Radix UI configuration
│   ├── tailwind.config.ts       # Tailwind CSS configuration
│   └── next.config.ts           # Next.js configuration
├── .github/workflows/           # CI/CD pipeline
├── docker-compose.yml           # Full development environment
├── README.md                    # Project documentation (English)
└── README.ko.md                 # Project documentation (Korean)
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
