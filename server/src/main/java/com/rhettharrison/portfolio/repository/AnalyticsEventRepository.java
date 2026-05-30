package com.rhettharrison.portfolio.repository;

import com.rhettharrison.portfolio.model.AnalyticsEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {

    /** Projection for label/count aggregations (referrers, pages, UTM, devices). */
    interface LabelCount {
        String getLabel();
        long getCount();
    }

    /** Projection for the daily time-series. */
    interface DayCount {
        String getDay();
        long getPageViews();
        long getVisitors();
    }

    @Query(value = "SELECT COUNT(*) FROM analytics_events WHERE created_at BETWEEN :from AND :to",
        nativeQuery = true)
    long countPageViews(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query(value = "SELECT COUNT(DISTINCT visitor_hash) FROM analytics_events WHERE created_at BETWEEN :from AND :to",
        nativeQuery = true)
    long countUniqueVisitors(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query(value = "SELECT COUNT(DISTINCT session_id) FROM analytics_events WHERE created_at BETWEEN :from AND :to",
        nativeQuery = true)
    long countSessions(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Average per-session total dwell time, in milliseconds (null when no data). */
    @Query(value = """
        SELECT AVG(session_total) FROM (
            SELECT session_id, COALESCE(SUM(dwell_ms), 0) AS session_total
            FROM analytics_events
            WHERE created_at BETWEEN :from AND :to
            GROUP BY session_id
        ) s
        """, nativeQuery = true)
    Double avgSessionDurationMs(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    /** Sessions consisting of exactly one page view (used for bounce rate). */
    @Query(value = """
        SELECT COUNT(*) FROM (
            SELECT session_id
            FROM analytics_events
            WHERE created_at BETWEEN :from AND :to
            GROUP BY session_id
            HAVING COUNT(*) = 1
        ) b
        """, nativeQuery = true)
    long countSingleViewSessions(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query(value = """
        SELECT referrer_host AS label, COUNT(*) AS count
        FROM analytics_events
        WHERE created_at BETWEEN :from AND :to AND referrer_host IS NOT NULL
        GROUP BY referrer_host
        ORDER BY count DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<LabelCount> topReferrers(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to,
                                  @Param("limit") int limit);

    @Query(value = """
        SELECT path AS label, COUNT(*) AS count
        FROM analytics_events
        WHERE created_at BETWEEN :from AND :to
        GROUP BY path
        ORDER BY count DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<LabelCount> topPages(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to,
                              @Param("limit") int limit);

    @Query(value = """
        SELECT utm_source AS label, COUNT(*) AS count
        FROM analytics_events
        WHERE created_at BETWEEN :from AND :to AND utm_source IS NOT NULL
        GROUP BY utm_source
        ORDER BY count DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<LabelCount> topUtmSources(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to,
                                   @Param("limit") int limit);

    @Query(value = """
        SELECT utm_medium AS label, COUNT(*) AS count
        FROM analytics_events
        WHERE created_at BETWEEN :from AND :to AND utm_medium IS NOT NULL
        GROUP BY utm_medium
        ORDER BY count DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<LabelCount> topUtmMediums(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to,
                                   @Param("limit") int limit);

    @Query(value = """
        SELECT utm_campaign AS label, COUNT(*) AS count
        FROM analytics_events
        WHERE created_at BETWEEN :from AND :to AND utm_campaign IS NOT NULL
        GROUP BY utm_campaign
        ORDER BY count DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<LabelCount> topUtmCampaigns(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to,
                                     @Param("limit") int limit);

    @Query(value = """
        SELECT device_type AS label, COUNT(*) AS count
        FROM analytics_events
        WHERE created_at BETWEEN :from AND :to AND device_type IS NOT NULL
        GROUP BY device_type
        ORDER BY count DESC
        """, nativeQuery = true)
    List<LabelCount> deviceTypes(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query(value = """
        SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS day,
               COUNT(*) AS pageViews,
               COUNT(DISTINCT visitor_hash) AS visitors
        FROM analytics_events
        WHERE created_at BETWEEN :from AND :to
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
        ORDER BY day
        """, nativeQuery = true)
    List<DayCount> dailyCounts(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
