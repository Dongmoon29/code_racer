-- 사용자 테이블에 role 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 기존 사용자들의 role을 'user'로 설정 (안전을 위해)
UPDATE users SET role = 'user' WHERE role IS NULL;

-- role 컬럼을 NOT NULL로 설정
ALTER TABLE users ALTER COLUMN role SET NOT NULL;

-- role 컬럼에 체크 제약 조건 추가 (user 또는 admin만 허용)
ALTER TABLE users ADD CONSTRAINT check_role CHECK (role IN ('user', 'admin'));

-- role 컬럼에 인덱스 추가 (권한 체크 성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
