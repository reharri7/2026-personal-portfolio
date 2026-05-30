package com.rhettharrison.portfolio.model;

import java.util.List;

/**
 * Result of a guess. When {@code accepted} is false the guess was rejected (wrong
 * length or not a real word) and {@code statuses} is null. {@code answer} is only
 * populated on a win — it is never sent otherwise, keeping the secret server-side.
 */
public record RherdleGuessResponse(
    boolean accepted,
    String reason,
    List<String> statuses,
    boolean won,
    String answer
) {
    public static RherdleGuessResponse rejected(String reason) {
        return new RherdleGuessResponse(false, reason, null, false, null);
    }

    public static RherdleGuessResponse evaluated(List<String> statuses, boolean won, String answer) {
        return new RherdleGuessResponse(true, null, statuses, won, won ? answer : null);
    }
}
