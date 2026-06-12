package com.rhettharrison.portfolio.event;

/**
 * Published exactly when a blog post transitions to published. Carries plain fields
 * (not the entity) so the async listener has no lazy-loading concerns. Drives the
 * subscriber announcement broadcast.
 */
public record BlogPostPublishedEvent(
    String title,
    String slug,
    String excerpt,
    String coverImageUrl
) {}
