# Code Racer Backend

Code Racer is a backend API server for real-time coding competition games.

## 🚀 Tech Stack

- **Language**: Go 1.24.0
- **Web Framework**: Gin
- **Database**: PostgreSQL (GORM)
- **Cache**: Redis
- **Authentication**: JWT, OAuth2 (Google, GitHub)
- **Code Execution**: Judge0 API
- **Logging**: Zerolog
- **Testing**: Testify

## 📁 Project Structure

```
backend/
├── cmd/api/                 # Application entry point
│   └── main.go             # Main application
├── internal/                # Internal packages
│   ├── config/             # Configuration management
│   ├── controller/         # HTTP controllers
│   ├── middleware/         # Middleware
│   ├── model/              # Data models
│   ├── repository/         # Data access layer
│   ├── service/            # Business logic
│   ├── router/             # Routing configuration
│   ├── judge/              # Code execution related
│   ├── interfaces/         # Interface definitions
│   ├── types/              # Type definitions
│   ├── util/               # Utility functions
│   └── logger/             # Logging configuration
├── migrations/              # Database migrations
├── deployment/              # Deployment related files
├── docker-compose.yml       # Development environment setup
├── Dockerfile              # Container image
└── go.mod                  # Go module dependencies
```

## 🛠️ Installation and Setup

### Prerequisites

- Go 1.24.0 or higher
- PostgreSQL 12 or higher
- Redis 6.0 or higher
- Docker & Docker Compose (optional)

### Environment Variables Setup

Create a `.env` file and configure the following environment variables:

```env
# Database configuration
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=code_racer
DB_PORT=5432

# Redis configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=

# JWT configuration
JWT_SECRET=your_jwt_secret_key

# Server configuration
PORT=8080
FRONTEND_URL=http://localhost:3000

# Judge0 API configuration
JUDGE0_API_KEY=your_judge0_api_key
JUDGE0_API_ENDPOINT=https://judge0-ce.p.rapidapi.com

# OAuth configuration (Google)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth configuration (GitHub)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Local Development

```bash
# Install dependencies
go mod download

# Run database migrations
# (PostgreSQL must be running)

# Run the application
go run cmd/api/main.go
```

### Running with Docker

```bash
# Start development environment
docker-compose up -d

# Run the application
go run cmd/api/main.go
```

## 🗄️ Database

### Schema

Main tables:

- `users`: User information
- `games`: Game sessions
- `leetcode_problems`: LeetCode problems
- `game_submissions`: Game submission records

### Migrations

```bash
# Migration files are located in the migrations/ folder
# Create additional migrations as needed
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/github` - GitHub OAuth

### Games

- `GET /api/games` - Get game list
- `POST /api/games` - Create new game
- `GET /api/games/:id` - Get game information
- `POST /api/games/:id/join` - Join game
- `POST /api/games/:id/submit` - Submit solution
- `POST /api/games/:id/close` - Close game

### Users

- `GET /api/users/me` - Get current user information
- `GET /api/users/:userId/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

### LeetCode Problems (Admin)

- `GET /api/leetcode` - Get problem list
- `GET /api/leetcode/:id` - Get problem details
- `POST /api/leetcode` - Create new problem
- `PUT /api/leetcode/:id` - Update problem
- `DELETE /api/leetcode/:id` - Delete problem

### WebSocket

- `GET /ws/:gameId` - Real-time game communication

## 🔐 Authentication and Authorization

### JWT Token

- Access token-based authentication
- Automatic token validation through middleware

### OAuth2

- Google OAuth support
- GitHub OAuth support

### Permission Levels

- Regular users: Join games, submit solutions
- Administrators: Manage LeetCode problems

## 🧪 Testing

```bash
# Run all tests
go test ./...

# Test specific package
go test ./internal/controller

# Check test coverage
go test -cover ./...
```

## 📊 Monitoring

### Logging

- Structured logging using Zerolog
- Environment-specific log level configuration
- JSON format log output

### Health Check

- Server status check via `GET /health` endpoint

## 🚀 Deployment

### Building Docker Image

```bash
docker build -t code-racer-backend .
```

### Environment-specific Configuration

- Development: `gin.DebugMode`
- Production: `gin.ReleaseMode`

## 🔧 Development Guide

### Code Structure Principles

1. **Layer Separation**: Controller → Service → Repository → Model
2. **Dependency Injection**: Loose coupling through interfaces
3. **Error Handling**: Structured error responses
4. **Logging**: Logging for all important operations

### Adding New Features

1. Define models (`internal/model/`)
2. Implement repository (`internal/repository/`)
3. Implement service logic (`internal/service/`)
4. Implement controller (`internal/controller/`)
5. Add endpoints to router (`internal/router/`)

### Writing Tests

- Write unit tests for each layer
- Utilize test utilities (`internal/testutil/`)
- Isolate dependencies through mocking

## 🐛 Troubleshooting

### Common Issues

1. **Database connection failure**: Check environment variables
2. **Redis connection failure**: Check Redis server status
3. **JWT token errors**: Check JWT_SECRET environment variable
4. **Judge0 API errors**: Check API key and endpoint

### Checking Logs

```bash
# Check application logs
tail -f logs/app.log

# Check database logs
docker logs postgres
```

## 📝 License

This project is distributed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Contact

If you have any questions or suggestions about the project, please create an issue.
