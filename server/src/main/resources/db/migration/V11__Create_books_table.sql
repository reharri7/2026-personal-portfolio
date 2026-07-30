CREATE TABLE books (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    cover_image_url VARCHAR(1024),
    rating DOUBLE PRECISION,
    review TEXT,
    hot_take VARCHAR(500),
    genre VARCHAR(100),
    page_count INTEGER,
    status VARCHAR(16) NOT NULL DEFAULT 'FINISHED',
    started_at DATE,
    finished_at DATE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_finished_at ON books(finished_at);
