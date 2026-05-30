package com.rhettharrison.portfolio.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.jdbc.PostgreSqlJdbcIndexedSessionRepositoryCustomizer;
import org.springframework.session.jdbc.config.annotation.web.http.EnableJdbcHttpSession;

/**
 * Persists HTTP sessions to PostgreSQL via Spring Session JDBC so that an
 * authenticated session survives a server restart.
 *
 * <p>Spring Boot 4 modularized its auto-configuration and the session
 * auto-config module is not on the classpath, so Spring Session is enabled
 * explicitly here rather than via {@code spring.session.*} properties. The
 * SPRING_SESSION tables are created by Flyway (migration V8), so no schema
 * bootstrap is needed from Spring Session itself.
 */
@Configuration
@EnableJdbcHttpSession(maxInactiveIntervalInSeconds = 604800) // 7 days
public class SessionConfig {

    /**
     * Tunes the repository's SQL for PostgreSQL (e.g. upsert of session
     * attributes), which Boot would otherwise have selected automatically.
     */
    @Bean
    public PostgreSqlJdbcIndexedSessionRepositoryCustomizer postgreSqlSessionRepositoryCustomizer() {
        return new PostgreSqlJdbcIndexedSessionRepositoryCustomizer();
    }
}
