-- 테스트 유저가 없을 경우에만 생성
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = 'test_user'
   ) THEN
      CREATE USER test_user WITH PASSWORD 'test_password';
   END IF;
END
$do$;

-- 테스트 데이터베이스가 없을 경우에만 생성
CREATE DATABASE test_db WITH OWNER test_user;

-- test_db에 접속 시도. 실패하면 무시
\c test_db;

-- UUID extension 설치 (이미 있으면 무시)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 테스트 유저에게 모든 권한 부여 (이미 있어도 안전)
GRANT ALL PRIVILEGES ON DATABASE test_db TO test_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_user;

-- 향후 생성될 테이블에 대한 권한도 설정
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO test_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO test_user;

-- 스키마 권한 부여
GRANT ALL ON SCHEMA public TO test_user;
