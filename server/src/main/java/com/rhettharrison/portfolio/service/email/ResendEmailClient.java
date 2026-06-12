package com.rhettharrison.portfolio.service.email;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.broadcasts.model.CreateBroadcastOptions;
import com.resend.services.broadcasts.model.CreateBroadcastResponseSuccess;
import com.resend.services.broadcasts.model.SendBroadcastOptions;
import com.resend.services.contacts.model.CreateContactOptions;
import com.resend.services.contacts.model.ListContactsResponseSuccess;
import com.resend.services.emails.model.CreateEmailOptions;
import com.rhettharrison.portfolio.config.EmailProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Live Resend-backed {@link EmailClient}, active only when {@code app.email.enabled=true}.
 * Transactional mail uses the Emails API; the subscriber list and newsletter/blog
 * broadcasts use the Contacts + Broadcasts APIs scoped to the configured audience.
 *
 * <p>Failures are wrapped in {@link EmailSendException} (unchecked) so async listeners
 * surface them in logs without checked-exception noise on the call sites.
 */
@Component
@ConditionalOnProperty(name = "app.email.enabled", havingValue = "true")
@Slf4j
public class ResendEmailClient implements EmailClient {

    private final EmailProperties props;
    private final Resend resend;

    public ResendEmailClient(EmailProperties props) {
        this.props = props;
        this.resend = new Resend(props.resendApiKey());
    }

    @Override
    public void sendHtml(String to, String subject, String html) {
        CreateEmailOptions options = CreateEmailOptions.builder()
            .from(props.from())
            .to(to)
            .subject(subject)
            .html(html)
            .build();
        try {
            resend.emails().send(options);
        } catch (ResendException e) {
            throw new EmailSendException("Failed to send email to " + to, e);
        }
    }

    @Override
    public void createContact(String email) {
        CreateContactOptions options = CreateContactOptions.builder()
            .audienceId(props.audienceId())
            .email(email)
            .unsubscribed(false)
            .build();
        try {
            resend.contacts().create(options);
        } catch (ResendException e) {
            throw new EmailSendException("Failed to create contact " + email, e);
        }
    }

    @Override
    public List<Subscriber> listContacts() {
        try {
            ListContactsResponseSuccess response = resend.contacts().list(props.audienceId());
            return response.getData().stream()
                .map(c -> new Subscriber(c.getEmail(), c.getCreatedAt(), c.getUnsubscribed()))
                .toList();
        } catch (ResendException e) {
            throw new EmailSendException("Failed to list contacts", e);
        }
    }

    @Override
    public String createBroadcast(String subject, String html) {
        CreateBroadcastOptions options = CreateBroadcastOptions.builder()
            .audienceId(props.audienceId())
            .from(props.from())
            .subject(subject)
            .html(html)
            .build();
        try {
            CreateBroadcastResponseSuccess response = resend.broadcasts().create(options);
            return response.getId();
        } catch (ResendException e) {
            throw new EmailSendException("Failed to create broadcast", e);
        }
    }

    @Override
    public void sendBroadcast(String broadcastId) {
        try {
            resend.broadcasts().send(SendBroadcastOptions.builder().build(), broadcastId);
        } catch (ResendException e) {
            throw new EmailSendException("Failed to send broadcast " + broadcastId, e);
        }
    }
}
