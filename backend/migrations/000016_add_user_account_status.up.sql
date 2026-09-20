ALTER TABLE users
    ADD COLUMN account_status VARCHAR(20) NOT NULL DEFAULT 'active',
    ADD COLUMN deactivated_at TIMESTAMPTZ;

ALTER TABLE users
    ADD CONSTRAINT users_account_status_check
    CHECK (account_status IN ('active', 'deactivated', 'suspended'));

CREATE INDEX idx_users_account_status ON users (account_status);
