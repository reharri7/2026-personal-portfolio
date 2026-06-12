package com.rhettharrison.portfolio.service;

import com.rhettharrison.portfolio.config.EmailProperties;
import com.rhettharrison.portfolio.model.AnalyticsSummaryDTO;
import com.rhettharrison.portfolio.service.email.EmailClient;
import com.rhettharrison.portfolio.service.email.EmailTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Map;

/**
 * Weekly analytics digest emailed to the site owner. Reuses {@link AnalyticsService#getSummary}
 * over the trailing 7 days. {@link #sendDigest()} is also callable directly for verification.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsDigestService {

    private final AnalyticsService analyticsService;
    private final EmailTemplateService templates;
    private final EmailClient emailClient;
    private final EmailProperties props;

    /** Every Monday at 08:00 server time. */
    @Scheduled(cron = "0 0 8 * * MON")
    @Async("emailTaskExecutor")
    public void weeklyDigest() {
        try {
            sendDigest();
        } catch (RuntimeException e) {
            log.error("Failed to send weekly analytics digest", e);
        }
    }

    /** Builds and sends the digest for the trailing 7 days. */
    public void sendDigest() {
        LocalDateTime to = LocalDateTime.now();
        LocalDateTime from = LocalDate.now().minusDays(7).atTime(LocalTime.MIN);
        AnalyticsSummaryDTO summary = analyticsService.getSummary(from, to);

        Map<String, Object> model = Map.of(
            "pageViews", summary.pageViews(),
            "uniqueVisitors", summary.uniqueVisitors(),
            "sessions", summary.sessions(),
            "bouncePct", Math.round(summary.bounceRate() * 100),
            "topPages", summary.topPages(),
            "topReferrers", summary.topReferrers()
        );
        String html = templates.render("analytics-digest", model);
        emailClient.sendHtml(props.adminAddress(), "Your weekly analytics digest", html);
    }
}
