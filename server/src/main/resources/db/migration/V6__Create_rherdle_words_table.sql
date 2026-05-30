CREATE TABLE rherdle_words (
    id BIGSERIAL PRIMARY KEY,
    word VARCHAR(16) NOT NULL UNIQUE,
    scheduled_date DATE UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rherdle_words_scheduled_date ON rherdle_words(scheduled_date);

-- Starter answer pool (unscheduled). The server auto-assigns one of these to a
-- date when that date has no explicitly scheduled word.
INSERT INTO rherdle_words (word) VALUES
    ('crane'), ('slate'), ('about'), ('house'), ('mouse'), ('plant'), ('glory'),
    ('brave'), ('cloud'), ('flame'), ('grape'), ('haste'), ('ivory'), ('joker'),
    ('knack'), ('lemon'), ('mango'), ('noble'), ('olive'), ('pride'), ('quiet'),
    ('raven'), ('sugar'), ('tiger'), ('unity'), ('vivid'), ('wharf'), ('yacht'),
    ('zebra'), ('amber'), ('bloom');
