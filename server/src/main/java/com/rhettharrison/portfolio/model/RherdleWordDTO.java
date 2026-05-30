package com.rhettharrison.portfolio.model;

/**
 * Admin-only DTO — exposes the secret word. Never return this from a public endpoint.
 */
public record RherdleWordDTO(
    Long id,
    String word,
    String scheduledDate
) {
    public static RherdleWordDTO fromEntity(RherdleWord w) {
        return new RherdleWordDTO(
            w.getId(),
            w.getWord(),
            w.getScheduledDate() != null ? w.getScheduledDate().toString() : null
        );
    }
}
