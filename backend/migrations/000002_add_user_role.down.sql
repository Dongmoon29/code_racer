-- role 컬럼 인덱스 제거
DROP INDEX IF EXISTS idx_users_role;

-- role 체크 제약 조건 제거
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_role;

-- role 컬럼 제거
ALTER TABLE users DROP COLUMN IF EXISTS role;
