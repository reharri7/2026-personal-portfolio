package com.rhettharrison.portfolio.event;

/** Published when a user requests a password reset. Carries the raw token for the emailed link. */
public record PasswordResetRequestedEvent(String email, String rawToken) {}
