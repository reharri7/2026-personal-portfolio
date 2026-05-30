CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    visitor_hash VARCHAR(64) NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    path VARCHAR(512) NOT NULL,
    referrer_host VARCHAR(255),
    utm_source VARCHAR(128),
    utm_medium VARCHAR(128),
    utm_campaign VARCHAR(128),
    utm_term VARCHAR(128),
    utm_content VARCHAR(128),
    dwell_ms BIGINT,
    device_type VARCHAR(16),
    browser VARCHAR(32),
    country VARCHAR(2),
    is_entry BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_visitor_hash ON analytics_events(visitor_hash);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_referrer_host ON analytics_events(referrer_host);
CREATE INDEX idx_analytics_events_utm_source ON analytics_events(utm_source);
