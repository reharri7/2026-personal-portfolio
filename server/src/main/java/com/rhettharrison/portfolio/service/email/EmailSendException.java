package com.rhettharrison.portfolio.service.email;

/** Unchecked wrapper for provider (Resend) failures so async listeners stay clean. */
public class EmailSendException extends RuntimeException {
    public EmailSendException(String message, Throwable cause) {
        super(message, cause);
    }
}
