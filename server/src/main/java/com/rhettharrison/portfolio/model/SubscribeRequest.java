package com.rhettharrison.portfolio.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Public newsletter subscribe payload. */
public record SubscribeRequest(
    @NotBlank @Email @Size(max = 254) String email
) {}
