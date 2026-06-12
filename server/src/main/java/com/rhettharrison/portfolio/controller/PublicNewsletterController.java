package com.rhettharrison.portfolio.controller;

import com.rhettharrison.portfolio.model.SubscribeRequest;
import com.rhettharrison.portfolio.service.NewsletterService;
import com.rhettharrison.portfolio.service.email.ConfirmationTokenService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Public newsletter endpoints. Subscription is double opt-in: {@code /subscribe} sends a
 * confirmation email; {@code /confirm} validates the token and creates the Resend contact.
 * Unsubscribe is handled entirely by Resend's hosted flow, so there is no endpoint for it.
 */
@RestController
@RequestMapping("/api/public/newsletter")
@RequiredArgsConstructor
public class PublicNewsletterController {

    private final NewsletterService newsletterService;
    private final ConfirmationTokenService confirmationTokens;

    /** Begins double opt-in. Always 202 (non-enumerating — never reveals if an email is known). */
    @PostMapping("/subscribe")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void subscribe(@Valid @RequestBody SubscribeRequest request) {
        newsletterService.requestSubscription(request.email());
    }

    /** Completes subscription from the emailed confirmation link's token. */
    @PostMapping("/confirm")
    @ResponseStatus(HttpStatus.OK)
    public void confirm(@Valid @RequestBody ConfirmRequest request) {
        String email = confirmationTokens.verify(request.token());
        newsletterService.confirm(email);
    }

    public record ConfirmRequest(@NotBlank String token) {}
}
