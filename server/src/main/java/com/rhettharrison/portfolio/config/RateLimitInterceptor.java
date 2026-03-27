package com.rhettharrison.portfolio.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String key = getClientKey(request);
        Bucket bucket = resolveBucket(key, request);

        if (bucket.tryConsume(1)) {
            return true;
        }

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.getWriter().write("{\"error\": \"Too many requests. Please try again later.\"}");
        response.setContentType("application/json");
        return false;
    }

    private Bucket resolveBucket(String key, HttpServletRequest request) {
        return cache.computeIfAbsent(key, k -> createBucket(request));
    }

    private Bucket createBucket(HttpServletRequest request) {
        String path = request.getRequestURI();

        // Stricter limits for authentication endpoints
        if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register")) {
            // 5 requests per minute for auth endpoints
            return Bucket.builder()
                .addLimit(Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1))))
                .build();
        }

        // Moderate limit for contact form
        if (path.startsWith("/api/contact") && "POST".equals(request.getMethod())) {
            // 10 requests per hour for contact submissions
            return Bucket.builder()
                .addLimit(Bandwidth.classic(10, Refill.intervally(10, Duration.ofHours(1))))
                .build();
        }

        // Default limit for other endpoints
        // 100 requests per minute
        return Bucket.builder()
            .addLimit(Bandwidth.classic(100, Refill.intervally(100, Duration.ofMinutes(1))))
            .build();
    }

    private String getClientKey(HttpServletRequest request) {
        String path = request.getRequestURI();
        String clientIp = getClientIP(request);
        return clientIp + ":" + path;
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
