package com.rhettharrison.portfolio.service.email;

import org.junit.jupiter.api.Test;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Renders the email templates with a Spring Thymeleaf engine (no application context / DB),
 * verifying the shared layout fragment composes and variables interpolate. Uses
 * SpringTemplateEngine (SpEL) to mirror the autoconfigured runtime engine.
 */
class EmailTemplateServiceTest {

    private EmailTemplateService newService() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
        return new EmailTemplateService(engine);
    }

    @Test
    void rendersContactAcknowledgementWithLayoutAndVariables() {
        String html = newService().render("contact-acknowledgement", Map.of(
            "name", "Ada Lovelace",
            "subject", "Hello",
            "message", "Loved the site!"
        ));

        // Layout shell is present
        assertThat(html).contains("Rhett Harrison");
        assertThat(html).contains("Sent from rhettharrison.com");
        // Content + variables interpolated
        assertThat(html).contains("Thanks for reaching out");
        assertThat(html).contains("Ada Lovelace");
        assertThat(html).contains("Loved the site!");
    }

    @Test
    void rendersBlogAnnouncementWithOptionalFields() {
        java.util.Map<String, Object> model = new java.util.HashMap<>();
        model.put("title", "Hello World");
        model.put("excerpt", "A first post");
        model.put("coverImageUrl", null); // optional — must render without error
        model.put("url", "http://localhost:4200/blog/hello-world");

        String html = newService().render("blog-announcement", model);

        assertThat(html).contains("Hello World");
        assertThat(html).contains("A first post");
        assertThat(html).contains("http://localhost:4200/blog/hello-world");
        assertThat(html).doesNotContain("<img"); // null cover image omitted
    }

    @Test
    void rendersNewsletterWithUnescapedBody() {
        String html = newService().render("newsletter", Map.of(
            "subject", "June Update",
            "body", "<p>Hello <strong>friends</strong></p>"
        ));

        assertThat(html).contains("June Update");
        assertThat(html).contains("<strong>friends</strong>"); // body rendered unescaped
    }

    @Test
    void rendersAuthAndDigestTemplates() {
        EmailTemplateService svc = newService();

        assertThat(svc.render("welcome", Map.of("displayName", "Ada")))
            .contains("Welcome").contains("Ada");

        assertThat(svc.render("password-reset", Map.of("resetUrl", "http://localhost:4200/reset-password?token=abc")))
            .contains("Reset your password").contains("token=abc");

        assertThat(svc.render("subscription-confirm", Map.of("confirmUrl", "http://x/confirm?token=t")))
            .contains("Confirm").contains("token=t");

        assertThat(svc.render("sticker-approved", Map.of("username", "Ada", "stickerWallUrl", "http://x/fun/sticker-wall")))
            .contains("Ada").contains("/fun/sticker-wall");

        java.util.Map<String, Object> digest = new java.util.HashMap<>();
        digest.put("pageViews", 100L);
        digest.put("uniqueVisitors", 40L);
        digest.put("sessions", 60L);
        digest.put("bouncePct", 25L);
        digest.put("topPages", java.util.List.of(new com.rhettharrison.portfolio.model.AnalyticsSummaryDTO.CountItem("/blog", 30)));
        digest.put("topReferrers", java.util.List.of());
        assertThat(svc.render("analytics-digest", digest))
            .contains("Weekly analytics digest").contains("/blog").contains("No data");
    }

    @Test
    void rendersContactAdminNotification() {
        String html = newService().render("contact-admin-notification", Map.of(
            "name", "Ada Lovelace",
            "email", "ada@example.com",
            "subject", "Hello",
            "message", "Loved the site!"
        ));

        assertThat(html).contains("New contact submission");
        assertThat(html).contains("ada@example.com");
        assertThat(html).contains("Loved the site!");
    }
}
