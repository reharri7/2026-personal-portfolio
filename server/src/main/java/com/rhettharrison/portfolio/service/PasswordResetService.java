package com.rhettharrison.portfolio.service;

import com.rhettharrison.portfolio.event.PasswordResetRequestedEvent;
import com.rhettharrison.portfolio.model.PasswordResetToken;
import com.rhettharrison.portfolio.model.User;
import com.rhettharrison.portfolio.repository.PasswordResetTokenRepository;
import com.rhettharrison.portfolio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;

/**
 * Password reset via single-use tokens. The raw token is emailed; only its SHA-256 hash is
 * stored, so a database leak can't be used to reset passwords. Tokens expire after 1 hour.
 */
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final long TTL_MINUTES = 60;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;
    private final SecureRandom secureRandom = new SecureRandom();

    /** Issues a reset token if the email maps to a user. Silent no-op otherwise (non-enumerating). */
    @Transactional
    public void requestReset(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return;
        }
        // Only one active token per user.
        tokenRepository.deleteByUserId(user.getId());

        byte[] raw = new byte[32];
        secureRandom.nextBytes(raw);
        String rawToken = HexFormat.of().formatHex(raw);

        PasswordResetToken token = new PasswordResetToken();
        token.setUserId(user.getId());
        token.setTokenHash(hash(rawToken));
        token.setExpiresAt(LocalDateTime.now().plusMinutes(TTL_MINUTES));
        tokenRepository.save(token);

        eventPublisher.publishEvent(new PasswordResetRequestedEvent(user.getEmail(), rawToken));
    }

    /** Consumes a valid token and sets the new password. */
    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        PasswordResetToken token = tokenRepository.findByTokenHash(hash(rawToken))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or used reset link"));
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(token);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This reset link has expired");
        }
        User user = userRepository.findById(token.getUserId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid reset link"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        tokenRepository.delete(token);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
