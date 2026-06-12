package com.rhettharrison.portfolio.service.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Default email client used whenever {@code app.email.enabled} is unset or false.
 * Logs would-be operations instead of calling Resend, so local dev and tests never
 * hit the network. Replaced by {@link ResendEmailClient} when email is enabled.
 */
@Component
@ConditionalOnProperty(name = "app.email.enabled", havingValue = "false", matchIfMissing = true)
@Slf4j
public class NoOpEmailClient implements EmailClient {

    @Override
    public void sendHtml(String to, String subject, String html) {
        log.info("[email:noop] sendHtml to={} subject=\"{}\" ({} chars html)", to, subject, html.length());
        log.debug("[email:noop] html body:\n{}", html);
    }

    @Override
    public void createContact(String email) {
        log.info("[email:noop] createContact email={}", email);
    }

    @Override
    public List<Subscriber> listContacts() {
        log.info("[email:noop] listContacts -> []");
        return List.of();
    }

    @Override
    public String createBroadcast(String subject, String html) {
        log.info("[email:noop] createBroadcast subject=\"{}\" ({} chars html)", subject, html.length());
        return "noop-broadcast";
    }

    @Override
    public void sendBroadcast(String broadcastId) {
        log.info("[email:noop] sendBroadcast id={}", broadcastId);
    }
}
