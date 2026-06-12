package com.rhettharrison.portfolio.service.email;

import java.util.List;

/**
 * Abstraction over the email provider (Resend). Two impls exist: {@link ResendEmailClient}
 * (live, loaded when {@code app.email.enabled=true}) and {@link NoOpEmailClient} (default,
 * logs would-be sends so local dev and tests stay offline).
 *
 * <p>Transactional mail goes through {@link #sendHtml}; the marketing audience and
 * newsletter/blog broadcasts are managed by Resend via the contact/broadcast methods.
 */
public interface EmailClient {

    /** Sends a single transactional HTML email. */
    void sendHtml(String to, String subject, String html);

    /** Adds a contact (subscribed) to the configured Resend audience. */
    void createContact(String email);

    /** Lists contacts in the configured Resend audience. */
    List<Subscriber> listContacts();

    /** Creates a broadcast against the audience and returns its id (not yet sent). */
    String createBroadcast(String subject, String html);

    /** Sends a previously-created broadcast. */
    void sendBroadcast(String broadcastId);

    /** Lightweight view of a Resend contact for the admin subscriber list. */
    record Subscriber(String email, String createdAt, boolean unsubscribed) {}
}
