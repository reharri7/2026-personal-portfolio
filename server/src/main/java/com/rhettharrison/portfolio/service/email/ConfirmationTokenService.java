package com.rhettharrison.portfolio.service.email;

import com.rhettharrison.portfolio.config.EmailProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

/**
 * Stateless double-opt-in tokens. A token carries {@code email|expiryEpochSeconds} signed
 * with HMAC-SHA256 keyed by {@code app.email.token-secret} — no database row is needed.
 * {@link #verify(String)} validates the signature (constant-time) and expiry, returning the
 * email, or throws {@link ResponseStatusException} for a tampered/expired token.
 */
@Service
@RequiredArgsConstructor
public class ConfirmationTokenService {

    private static final String HMAC_ALGO = "HmacSHA256";
    private static final long TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
    private static final Base64.Encoder ENC = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DEC = Base64.getUrlDecoder();

    private final EmailProperties props;

    /** Builds a signed token for the given email, valid for {@value #TTL_SECONDS} seconds. */
    public String generate(String email) {
        long expiry = Instant.now().getEpochSecond() + TTL_SECONDS;
        String payload = email + "|" + expiry;
        String payloadB64 = ENC.encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return payloadB64 + "." + ENC.encodeToString(sign(payload));
    }

    /** @return the email if the token is valid and unexpired; otherwise throws 400. */
    public String verify(String token) {
        if (token == null || !token.contains(".")) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid confirmation link");
        }
        String[] parts = token.split("\\.", 2);
        String payload;
        byte[] providedSig;
        try {
            payload = new String(DEC.decode(parts[0]), StandardCharsets.UTF_8);
            providedSig = DEC.decode(parts[1]);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid confirmation link");
        }

        if (!MessageDigest.isEqual(sign(payload), providedSig)) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid confirmation link");
        }

        int sep = payload.lastIndexOf('|');
        if (sep < 0) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid confirmation link");
        }
        long expiry;
        try {
            expiry = Long.parseLong(payload.substring(sep + 1));
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid confirmation link");
        }
        if (Instant.now().getEpochSecond() > expiry) {
            throw new ResponseStatusException(BAD_REQUEST, "This confirmation link has expired");
        }
        return payload.substring(0, sep);
    }

    private byte[] sign(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(props.tokenSecret().getBytes(StandardCharsets.UTF_8), HMAC_ALGO));
            return mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to sign confirmation token", e);
        }
    }
}
