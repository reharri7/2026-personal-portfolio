package com.rhettharrison.portfolio.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "analytics_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "visitor_hash", nullable = false, length = 64)
    private String visitorHash;

    @Column(name = "session_id", nullable = false, length = 64)
    private String sessionId;

    @Column(nullable = false, length = 512)
    private String path;

    @Column(name = "referrer_host", length = 255)
    private String referrerHost;

    @Column(name = "utm_source", length = 128)
    private String utmSource;

    @Column(name = "utm_medium", length = 128)
    private String utmMedium;

    @Column(name = "utm_campaign", length = 128)
    private String utmCampaign;

    @Column(name = "utm_term", length = 128)
    private String utmTerm;

    @Column(name = "utm_content", length = 128)
    private String utmContent;

    @Column(name = "dwell_ms")
    private Long dwellMs;

    @Column(name = "device_type", length = 16)
    private String deviceType;

    @Column(length = 32)
    private String browser;

    @Column(length = 2)
    private String country;

    @Column(name = "is_entry", nullable = false)
    private Boolean isEntry = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
