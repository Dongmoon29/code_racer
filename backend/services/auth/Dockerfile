# 빌더 스테이지
FROM --platform=$BUILDPLATFORM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY . .
RUN ./gradlew clean bootJar --no-daemon

# 실행 스테이지
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# 타임존 설정
RUN apk --no-cache add tzdata
ENV TZ=Asia/Seoul

# 비루트 사용자 생성
RUN addgroup -S spring && adduser -S spring -G spring
USER spring

# 빌더 스테이지에서 생성된 jar 파일 복사
COPY --from=builder /app/build/libs/*.jar app.jar

# Cloud Run을 위한 PORT 환경변수 기본값 설정
ENV PORT=8080
EXPOSE ${PORT}

# 메모리 설정 및 실행
ENV JAVA_OPTS="-Xms512m -Xmx512m"
CMD ["sh", "-c", "java ${JAVA_OPTS} -jar app.jar --server.port=${PORT}"]