package com.rhettharrison.portfolio.service;

import com.rhettharrison.portfolio.config.EmailProperties;
import com.rhettharrison.portfolio.event.BlogPostPublishedEvent;
import com.rhettharrison.portfolio.event.SubscriptionRequestedEvent;
import com.rhettharrison.portfolio.model.SubscriberDTO;
import com.rhettharrison.portfolio.service.email.EmailClient;
import com.rhettharrison.portfolio.service.email.EmailTemplateService;
import com.rhettharrison.portfolio.service.email.EmailSendException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Newsletter/blog subscription orchestration. Subscribers live in Resend (an Audience);
 * double opt-in is enforced here via {@link com.rhettharrison.portfolio.service.email.ConfirmationTokenService}
 * — a contact is created in Resend only after the confirmation link is clicked.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NewsletterService {

    private final ApplicationEventPublisher eventPublisher;
    private final EmailClient emailClient;
    private final EmailTemplateService templates;
    private final EmailProperties props;

    /**
     * Begins a double-opt-in subscription. Always succeeds (non-enumerating) — the
     * confirmation email is sent asynchronously by the email listener.
     */
    public void requestSubscription(String email) {
        eventPublisher.publishEvent(new SubscriptionRequestedEvent(email.trim().toLowerCase()));
    }

    /**
     * Completes subscription: validates the token, creates the Resend contact, and sends a
     * welcome email (best-effort — a welcome failure must not fail the confirmation).
     */
    public void confirm(String email) {
        emailClient.createContact(email);
        try {
            String html = templates.render("subscription-welcome", Map.of("email", email));
            emailClient.sendHtml(email, "You're subscribed", html);
        } catch (EmailSendException e) {
            log.warn("Subscription confirmed for {} but welcome email failed", email, e);
        }
    }

    /** Live subscriber list from Resend, for the admin panel. */
    public List<SubscriberDTO> listSubscribers() {
        return emailClient.listContacts().stream()
            .map(c -> new SubscriberDTO(c.email(), c.createdAt(), c.unsubscribed()))
            .toList();
    }

    /** Admin: compose and send a newsletter to the audience as a Resend broadcast. */
    public void sendNewsletter(String subject, String bodyHtml) {
        String html = templates.render("newsletter", Map.of("subject", subject, "body", bodyHtml));
        String broadcastId = emailClient.createBroadcast(subject, html);
        emailClient.sendBroadcast(broadcastId);
    }

    /** Announces a newly published blog post to the audience as a Resend broadcast. */
    public void announceBlogPost(BlogPostPublishedEvent post) {
        String subject = "New post: " + post.title();
        Map<String, Object> model = new HashMap<>();
        model.put("title", post.title());
        model.put("excerpt", post.excerpt());
        model.put("coverImageUrl", post.coverImageUrl());
        model.put("url", props.baseUrl() + "/blog/" + post.slug());
        String html = templates.render("blog-announcement", model);
        String broadcastId = emailClient.createBroadcast(subject, html);
        emailClient.sendBroadcast(broadcastId);
    }
}
