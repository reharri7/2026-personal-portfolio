package com.rhettharrison.portfolio.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Payload sent by the browser for a single page view. The server derives the
 * anonymous visitor hash, referrer host and device info — the client never
 * sends identifying data directly.
 */
public record AnalyticsEventRequest(
    @NotBlank @Size(max = 512) String path,
    @Size(max = 1024) String referrer,
    @Size(max = 128) String utmSource,
    @Size(max = 128) String utmMedium,
    @Size(max = 128) String utmCampaign,
    @Size(max = 128) String utmTerm,
    @Size(max = 128) String utmContent,
    @NotBlank @Size(max = 64) String sessionId,
    @PositiveOrZero Long dwellMs,
    Boolean isEntry
) {
}
