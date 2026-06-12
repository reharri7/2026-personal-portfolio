package com.rhettharrison.portfolio.event;

/** Published after a new user registers. Drives the welcome email. */
public record UserRegisteredEvent(String email, String displayName) {}
