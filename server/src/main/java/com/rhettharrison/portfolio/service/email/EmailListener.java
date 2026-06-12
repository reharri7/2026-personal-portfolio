package com.rhettharrison.portfolio.service.email;

import com.rhettharrison.portfolio.config.EmailProperties;
import com.rhettharrison.portfolio.event.BlogPostPublishedEvent;
import com.rhettharrison.portfolio.event.ContactSubmittedEvent;
import com.rhettharrison.portfolio.event.PasswordResetRequestedEvent;
import com.rhettharrison.portfolio.event.StickerModeratedEvent;
import com.rhettharrison.portfolio.event.SubscriptionRequestedEvent;
import com.rhettharrison.portfolio.event.UserRegisteredEvent;
import com.rhettharrison.portfolio.model.Contact;
import com.rhettharrison.portfolio.service.NewsletterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Sends email in response to domain events. Handlers run on the {@code emailTaskExecutor}
 * pool only after the originating transaction commits, so a rolled-back action never emails
 * and the request thread is never blocked on the network. Exceptions are logged, not rethrown.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EmailListener {

    private final EmailClient emailClient;
    private final EmailTemplateService templates;
    private final EmailProperties props;
    private final ConfirmationTokenService confirmationTokens;
    private final NewsletterService newsletterService;

    @Async("emailTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onContactSubmitted(ContactSubmittedEvent event) {
        Contact c = event.contact();
        try {
            // Notify the site owner.
            String adminHtml = templates.render("contact-admin-notification", Map.of(
                "name", c.getName(),
                "email", c.getEmail(),
                "subject", c.getSubject(),
                "message", c.getMessage()
            ));
            emailClient.sendHtml(props.adminAddress(), "New contact: " + c.getSubject(), adminHtml);

            // Acknowledge the sender.
            String ackHtml = templates.render("contact-acknowledgement", Map.of(
                "name", c.getName(),
                "subject", c.getSubject(),
                "message", c.getMessage()
            ));
            emailClient.sendHtml(c.getEmail(), "Thanks for reaching out", ackHtml);
        } catch (RuntimeException e) {
            log.error("Failed to send contact emails for submission from {}", c.getEmail(), e);
        }
    }

    /**
     * Sends the double-opt-in confirmation email. Plain {@code @EventListener} (no
     * transaction is involved in a subscribe request) running async off the request thread.
     */
    @Async("emailTaskExecutor")
    @EventListener
    public void onSubscriptionRequested(SubscriptionRequestedEvent event) {
        String email = event.email();
        try {
            String token = confirmationTokens.generate(email);
            String confirmUrl = props.baseUrl() + "/newsletter/confirm?token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8);
            String html = templates.render("subscription-confirm", Map.of("confirmUrl", confirmUrl));
            emailClient.sendHtml(email, "Confirm your subscription", html);
        } catch (RuntimeException e) {
            log.error("Failed to send subscription confirmation to {}", email, e);
        }
    }

    /** Sends the subscriber announcement broadcast after a post is published and committed. */
    @Async("emailTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBlogPostPublished(BlogPostPublishedEvent event) {
        try {
            newsletterService.announceBlogPost(event);
        } catch (RuntimeException e) {
            log.error("Failed to send blog announcement broadcast for '{}'", event.title(), e);
        }
    }

    /** Welcomes a newly registered user. Plain async listener — registration isn't in a transaction. */
    @Async("emailTaskExecutor")
    @EventListener
    public void onUserRegistered(UserRegisteredEvent event) {
        try {
            String html = templates.render("welcome", Map.of("displayName", event.displayName()));
            emailClient.sendHtml(event.email(), "Welcome to rhettharrison.com", html);
        } catch (RuntimeException e) {
            log.error("Failed to send welcome email to {}", event.email(), e);
        }
    }

    /** Sends the password reset link after the token is committed. */
    @Async("emailTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPasswordResetRequested(PasswordResetRequestedEvent event) {
        try {
            String resetUrl = props.baseUrl() + "/reset-password?token="
                + URLEncoder.encode(event.rawToken(), StandardCharsets.UTF_8);
            String html = templates.render("password-reset", Map.of("resetUrl", resetUrl));
            emailClient.sendHtml(event.email(), "Reset your password", html);
        } catch (RuntimeException e) {
            log.error("Failed to send password reset email to {}", event.email(), e);
        }
    }

    /** Notifies the sticker submitter of the moderation outcome (only fired when they left an email). */
    @Async("emailTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onStickerModerated(StickerModeratedEvent event) {
        try {
            String template = event.approved() ? "sticker-approved" : "sticker-rejected";
            String subject = event.approved()
                ? "Your sticker is live on the wall!"
                : "About your sticker submission";
            String html = templates.render(template, Map.of(
                "username", event.username(),
                "stickerWallUrl", props.baseUrl() + "/fun/sticker-wall"
            ));
            emailClient.sendHtml(event.email(), subject, html);
        } catch (RuntimeException e) {
            log.error("Failed to send sticker moderation email to {}", event.email(), e);
        }
    }
}
