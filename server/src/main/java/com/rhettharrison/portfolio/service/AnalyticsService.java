package com.rhettharrison.portfolio.service;

import com.rhettharrison.portfolio.model.AnalyticsEvent;
import com.rhettharrison.portfolio.model.AnalyticsEventRequest;
import com.rhettharrison.portfolio.model.AnalyticsSummaryDTO;
import com.rhettharrison.portfolio.model.AnalyticsSummaryDTO.CountItem;
import com.rhettharrison.portfolio.model.AnalyticsSummaryDTO.DailyCount;
import com.rhettharrison.portfolio.repository.AnalyticsEventRepository;
import com.rhettharrison.portfolio.repository.AnalyticsEventRepository.LabelCount;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;

/**
 * Privacy-first analytics collection. Visitors are identified by a daily-rotating
 * anonymous hash of (salt + IP + user-agent); the raw IP is never persisted.
 */
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AnalyticsEventRepository analyticsEventRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    // Rotating daily salt kept in memory: regenerated whenever the date changes so
    // visitor hashes cannot be correlated across days and are not reversible.
    private volatile String dailySalt = newSalt();
    private volatile LocalDate saltDate = LocalDate.now();

    @Transactional
    public void record(AnalyticsEventRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIP(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        AnalyticsEvent event = new AnalyticsEvent();
        event.setVisitorHash(visitorHash(clientIp, userAgent));
        event.setSessionId(request.sessionId());
        event.setPath(request.path());
        event.setReferrerHost(parseHost(request.referrer()));
        event.setUtmSource(request.utmSource());
        event.setUtmMedium(request.utmMedium());
        event.setUtmCampaign(request.utmCampaign());
        event.setUtmTerm(request.utmTerm());
        event.setUtmContent(request.utmContent());
        event.setDwellMs(request.dwellMs());
        event.setDeviceType(deviceType(userAgent));
        event.setBrowser(browser(userAgent));
        event.setIsEntry(Boolean.TRUE.equals(request.isEntry()));

        analyticsEventRepository.save(event);
    }

    private static final int TOP_LIMIT = 10;

    @Transactional(readOnly = true)
    public AnalyticsSummaryDTO getSummary(LocalDateTime from, LocalDateTime to) {
        long sessions = analyticsEventRepository.countSessions(from, to);
        long singleViewSessions = analyticsEventRepository.countSingleViewSessions(from, to);
        Double avgDuration = analyticsEventRepository.avgSessionDurationMs(from, to);
        double bounceRate = sessions == 0 ? 0.0 : (double) singleViewSessions / sessions;

        return new AnalyticsSummaryDTO(
            analyticsEventRepository.countPageViews(from, to),
            analyticsEventRepository.countUniqueVisitors(from, to),
            sessions,
            avgDuration == null ? 0L : Math.round(avgDuration),
            bounceRate,
            toItems(analyticsEventRepository.topReferrers(from, to, TOP_LIMIT)),
            toItems(analyticsEventRepository.topPages(from, to, TOP_LIMIT)),
            toItems(analyticsEventRepository.topUtmSources(from, to, TOP_LIMIT)),
            toItems(analyticsEventRepository.topUtmMediums(from, to, TOP_LIMIT)),
            toItems(analyticsEventRepository.topUtmCampaigns(from, to, TOP_LIMIT)),
            toItems(analyticsEventRepository.deviceTypes(from, to)),
            analyticsEventRepository.dailyCounts(from, to).stream()
                .map(d -> new DailyCount(d.getDay(), d.getPageViews(), d.getVisitors()))
                .toList()
        );
    }

    private List<CountItem> toItems(List<LabelCount> rows) {
        return rows.stream()
            .map(r -> new CountItem(r.getLabel(), r.getCount()))
            .toList();
    }

    private String visitorHash(String clientIp, String userAgent) {
        String salt = currentSalt();
        String raw = salt + "|" + (clientIp == null ? "" : clientIp) + "|" + (userAgent == null ? "" : userAgent);
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            // SHA-256 is always available on supported JVMs.
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private String currentSalt() {
        LocalDate today = LocalDate.now();
        if (!today.equals(saltDate)) {
            synchronized (this) {
                if (!today.equals(saltDate)) {
                    dailySalt = newSalt();
                    saltDate = today;
                }
            }
        }
        return dailySalt;
    }

    private String newSalt() {
        byte[] bytes = new byte[16];
        new SecureRandom().nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    /** Extracts just the host (e.g. "google.com") from a referrer URL, dropping path/query. */
    private String parseHost(String referrer) {
        if (referrer == null || referrer.isBlank()) {
            return null;
        }
        try {
            String host = URI.create(referrer.trim()).getHost();
            if (host == null) {
                return null;
            }
            return host.startsWith("www.") ? host.substring(4) : host;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String deviceType(String userAgent) {
        if (userAgent == null) {
            return null;
        }
        String ua = userAgent.toLowerCase();
        if (ua.contains("ipad") || ua.contains("tablet")) {
            return "tablet";
        }
        if (ua.contains("mobi") || ua.contains("iphone") || ua.contains("android")) {
            return "mobile";
        }
        return "desktop";
    }

    private String browser(String userAgent) {
        if (userAgent == null) {
            return null;
        }
        String ua = userAgent.toLowerCase();
        if (ua.contains("edg/") || ua.contains("edge")) {
            return "Edge";
        }
        if (ua.contains("opr/") || ua.contains("opera")) {
            return "Opera";
        }
        if (ua.contains("firefox")) {
            return "Firefox";
        }
        if (ua.contains("chrome") || ua.contains("chromium")) {
            return "Chrome";
        }
        if (ua.contains("safari")) {
            return "Safari";
        }
        return "Other";
    }

    /** Mirrors RateLimitInterceptor: prefer X-Forwarded-For when behind a proxy. */
    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isBlank()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
