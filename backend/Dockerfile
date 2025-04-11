# 빌더 스테이지
FROM --platform=$BUILDPLATFORM golang:1.24-alpine AS builder
# 빌드 인자 설정
ARG TARGETARCH
ARG TARGETOS
ARG BUILDPLATFORM
WORKDIR /app
# 의존성 파일 복사 및 다운로드
COPY go.mod go.sum ./
RUN go mod download
# 소스 코드 복사
COPY . .
# 타겟 플랫폼에 맞게 빌드
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -o /code_racer ./cmd/api/main.go
# 실행 스테이지
FROM alpine:3.19
WORKDIR /app
# 비루트 사용자 생성
RUN adduser -D appuser
# timezone 설정
RUN apk --no-cache add tzdata
ENV TZ=Asia/Seoul
# Cloud Run을 위한 PORT 환경변수 기본값 설정
ENV PORT=8080
# builder 이미지에서 바이너리 복사
COPY --from=builder /code_racer .
COPY --from=builder /app/migrations ./migrations
# 비루트 사용자로 변경
USER appuser
EXPOSE ${PORT}
# 환경변수를 사용하여 포트 지정
CMD ["sh", "-c", "./code_racer"]
