package com.rhettharrison.portfolio.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Strongly-typed binding for the {@code app.email.*} configuration. The {@code enabled}
 * flag selects the live Resend client vs. the no-op logging client (see EmailClient impls).
 */
@ConfigurationProperties(prefix = "app.email")
public record EmailProperties(
    boolean enabled,
    String resendApiKey,
    String fromAddress,
    String fromName,
    String adminAddress,
    String audienceId,
    String baseUrl,
    String tokenSecret,
    String webhookSecret
) {

    /** Sender header in the form {@code "Name <address>"} expected by Resend. */
    public String from() {
        return (fromName == null || fromName.isBlank())
            ? fromAddress
            : fromName + " <" + fromAddress + ">";
    }
}
