CREATE TABLE stickers (
    id BIGSERIAL PRIMARY KEY,
    image_path VARCHAR(512) NOT NULL,
    blur_data_url TEXT,
    username VARCHAR(30) NOT NULL,
    message VARCHAR(200),
    effect VARCHAR(32),
    x DOUBLE PRECISION NOT NULL,
    y DOUBLE PRECISION NOT NULL,
    width DOUBLE PRECISION NOT NULL,
    height DOUBLE PRECISION NOT NULL,
    rotation DOUBLE PRECISION NOT NULL,
    alpha_mask VARCHAR(64),
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMP
);

CREATE INDEX idx_stickers_status ON stickers(status);
CREATE INDEX idx_stickers_x_y ON stickers(x, y);
