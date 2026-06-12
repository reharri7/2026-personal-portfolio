-- Single-use, server-issued password reset tokens. Only a SHA-256 hash of the token is
-- stored; the raw token lives only in the emailed link.
CREATE TABLE password_reset_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    expires_at  TIMESTAMP NOT NULL,
    created_at  TIMESTAMP NOT NULL
);

CREATE INDEX idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);
