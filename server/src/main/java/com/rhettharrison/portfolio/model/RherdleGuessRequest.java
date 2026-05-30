package com.rhettharrison.portfolio.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * A guess submission. {@code mode} is "DAILY" or "BLOG"; {@code slug} is required for BLOG.
 */
public record RherdleGuessRequest(
    @NotBlank String mode,
    String slug,
    @NotBlank @Size(max = 16) String guess
) {}
