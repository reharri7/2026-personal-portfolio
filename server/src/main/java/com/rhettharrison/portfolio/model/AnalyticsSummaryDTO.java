package com.rhettharrison.portfolio.model;

import java.util.List;

/**
 * Aggregated analytics for a date range, returned to the admin dashboard.
 */
public record AnalyticsSummaryDTO(
    long pageViews,
    long uniqueVisitors,
    long sessions,
    long avgSessionDurationMs,
    double bounceRate,
    List<CountItem> topReferrers,
    List<CountItem> topPages,
    List<CountItem> utmSources,
    List<CountItem> utmMediums,
    List<CountItem> utmCampaigns,
    List<CountItem> deviceTypes,
    List<DailyCount> daily
) {
    public record CountItem(String label, long count) {
    }

    public record DailyCount(String date, long pageViews, long visitors) {
    }
}
