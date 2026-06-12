package com.rhettharrison.portfolio.event;

/** Published when someone requests a subscription. Drives the double-opt-in confirmation email. */
public record SubscriptionRequestedEvent(String email) {}
