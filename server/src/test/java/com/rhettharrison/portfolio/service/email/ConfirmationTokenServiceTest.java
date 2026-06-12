package com.rhettharrison.portfolio.service.email;

import com.rhettharrison.portfolio.config.EmailProperties;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ConfirmationTokenServiceTest {

    private ConfirmationTokenService service(String secret) {
        EmailProperties props = new EmailProperties(
            false, "", "from@x.com", "From", "admin@x.com", "aud", "http://localhost:4200", secret, "");
        return new ConfirmationTokenService(props);
    }

    @Test
    void roundTripsValidToken() {
        ConfirmationTokenService svc = service("super-secret-key");
        String token = svc.generate("Ada@Example.com");
        assertThat(svc.verify(token)).isEqualTo("Ada@Example.com");
    }

    @Test
    void rejectsTamperedPayload() {
        ConfirmationTokenService svc = service("super-secret-key");
        String token = svc.generate("ada@example.com");
        // Flip the payload to a different email while keeping the original signature.
        String tamperedPayload = java.util.Base64.getUrlEncoder().withoutPadding()
            .encodeToString(("evil@example.com|9999999999").getBytes(java.nio.charset.StandardCharsets.UTF_8));
        String tampered = tamperedPayload + "." + token.split("\\.", 2)[1];
        assertThatThrownBy(() -> svc.verify(tampered)).isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void rejectsTokenSignedWithDifferentSecret() {
        String token = service("secret-a").generate("ada@example.com");
        assertThatThrownBy(() -> service("secret-b").verify(token))
            .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void rejectsMalformedToken() {
        ConfirmationTokenService svc = service("super-secret-key");
        assertThatThrownBy(() -> svc.verify("garbage")).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> svc.verify(null)).isInstanceOf(ResponseStatusException.class);
    }
}
