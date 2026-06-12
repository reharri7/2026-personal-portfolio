package com.rhettharrison.portfolio.model;

import jakarta.validation.constraints.NotBlank;

/** Admin newsletter compose payload. {@code html} is the rich-text body to broadcast. */
public record SendNewsletterRequest(
    @NotBlank String subject,
    @NotBlank String html
) {}
