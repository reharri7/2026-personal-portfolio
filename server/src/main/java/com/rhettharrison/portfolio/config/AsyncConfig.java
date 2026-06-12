package com.rhettharrison.portfolio.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Enables asynchronous event handling and scheduling. Email is sent on the
 * {@link #emailTaskExecutor()} pool from {@code @TransactionalEventListener(AFTER_COMMIT)}
 * handlers so request threads are never blocked on the network.
 */
@Configuration
@EnableAsync
@EnableScheduling
@EnableConfigurationProperties(EmailProperties.class)
public class AsyncConfig {

    @Bean(name = "emailTaskExecutor")
    public Executor emailTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("email-");
        executor.initialize();
        return executor;
    }
}
