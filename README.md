# CodeRacer 🏁

실시간 코딩 대결 플랫폼 - 알고리즘 문제를 풀며 다른 개발자와 경쟁하세요!

## 🎯 프로젝트 소개

CodeRacer는 실시간으로 다른 개발자와 알고리즘 문제를 풀며 경쟁할 수 있는 플랫폼입니다. LeetCode 문제를 기반으로 한 실시간 코딩 대결, 멀티 언어 지원, 그리고 관리자 기능을 제공합니다.

## ✨ 주요 기능

- 🚀 **실시간 코딩 대결**: WebSocket을 통한 실시간 코드 동기화
- 📚 **LeetCode 통합**: 다양한 난이도의 알고리즘 문제
- 🌍 **멀티 언어 지원**: JavaScript, Python, Go, Java, C++
- 👑 **관리자 기능**: LeetCode 문제 관리 (Admin Role)
- 🔐 **소셜 로그인**: Google, GitHub OAuth 지원
- 🎨 **모던 UI**: Tailwind CSS 기반 반응형 디자인
- ⚡ **실시간 채점**: Judge0를 통한 안전한 코드 실행

## 🛠 기술 스택

### Frontend

- **Next.js 13+** - React 기반 풀스택 프레임워크
- **TypeScript** - 타입 안전성 보장
- **Tailwind CSS** - 유틸리티 기반 CSS
- **Zustand** - 경량 상태 관리
- **CodeMirror** - 코드 에디터

### Backend

- **Go 1.25** - 고성능 시스템 프로그래밍
- **Gin** - HTTP 웹 프레임워크
- **GORM** - Go ORM 라이브러리
- **PostgreSQL** - 주 데이터베이스
- **Redis** - 캐시 및 세션 관리
- **Judge0** - 코드 실행 및 채점

### DevOps

- **Docker** - 컨테이너화
- **GitHub Actions** - CI/CD 파이프라인
- **systemd** - 서비스 관리

## 📁 프로젝트 구조

```
code_racer/
├── frontend/                    # Next.js 프론트엔드
│   ├── src/
│   │   ├── components/         # React 컴포넌트
│   │   ├── pages/             # 페이지 컴포넌트
│   │   ├── stores/            # Zustand 스토어
│   │   └── lib/               # 유틸리티 및 설정
│   ├── ARCHITECTURE.md         # 프론트엔드 아키텍처 문서
│   └── README.md              # 프론트엔드 README
├── backend/                     # Go 백엔드
│   ├── internal/              # 내부 패키지
│   ├── cmd/                   # 애플리케이션 진입점
│   ├── migrations/            # 데이터베이스 마이그레이션
│   ├── ARCHITECTURE.md         # 백엔드 아키텍처 문서
│   └── README.md              # 백엔드 README
└── README.md                   # 프로젝트 메인 README
```

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/code_racer.git
cd code_racer
```

### 2. 백엔드 실행

```bash
cd backend

# 의존성 설치
go mod download

# 환경 변수 설정
cp env.example .env
# .env 파일 편집하여 데이터베이스 정보 입력

# 데이터베이스 실행
docker-compose up -d postgres redis

# 마이그레이션 실행
make migrate-up

# 서버 실행
go run cmd/api/main.go
```

### 3. 프론트엔드 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 4. 브라우저에서 접속

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080

## 📚 아키텍처 문서

프로젝트의 상세한 아키텍처와 설계 원칙을 확인하세요:

- **[프론트엔드 아키텍처](frontend/ARCHITECTURE.md)** - Next.js, React, TypeScript 기반 프론트엔드 설계
- **[백엔드 아키텍처](backend/ARCHITECTURE.md)** - Go, Gin, GORM 기반 백엔드 설계

## 🔧 개발 환경 설정

### 필수 요구사항

- **Go 1.25+**
- **Node.js 18+**
- **PostgreSQL 14+**
- **Redis 6+**
- **Docker & Docker Compose**

### 환경 변수

```bash
# Backend (.env)
DATABASE_URL=postgres://user:pass@localhost:5432/coderacer
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
JUDGE0_API_KEY=your-judge0-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

## 🧪 테스트

### 백엔드 테스트

```bash
cd backend
go test ./...
go test -v -cover ./...
```

### 프론트엔드 테스트

```bash
cd frontend
npm run test
npm run test:watch
```

## 🚀 배포

### Docker를 통한 배포

```bash
# 전체 스택 빌드 및 실행
docker-compose up -d

# 프로덕션 빌드
docker-compose -f docker-compose.prod.yml up -d
```

### 수동 배포

```bash
cd backend
make build
make deploy
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👥 팀

- **Dongmoon** - Full Stack Developer
- **Contributors** - 프로젝트에 기여한 모든 분들

## 🙏 감사의 말

- [LeetCode](https://leetcode.com/) - 알고리즘 문제 제공
- [Judge0](https://judge0.com/) - 코드 실행 서비스
- [Next.js](https://nextjs.org/) - React 프레임워크
- [Gin](https://gin-gonic.com/) - Go 웹 프레임워크

## 📞 연락처

프로젝트에 대한 질문이나 제안사항이 있으시면 [Issues](https://github.com/your-username/code_racer/issues)를 통해 연락해 주세요.

---

⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!
