package com.rhettharrison.portfolio.service.email;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Map;

/**
 * Renders Thymeleaf templates under {@code classpath:/templates/email/} to an HTML
 * string suitable for a transactional send or a broadcast body.
 */
@Service
@RequiredArgsConstructor
public class EmailTemplateService {

    private final TemplateEngine templateEngine;

    /**
     * @param template logical name relative to the email folder, e.g. {@code "contact-acknowledgement"}
     * @param variables model exposed to the template
     */
    public String render(String template, Map<String, Object> variables) {
        Context context = new Context();
        context.setVariables(variables);
        return templateEngine.process("email/" + template, context);
    }
}
