package com.rhettharrison.portfolio.model;

/** Admin-facing view of a newsletter subscriber (sourced live from Resend). */
public record SubscriberDTO(String email, String createdAt, boolean unsubscribed) {}
