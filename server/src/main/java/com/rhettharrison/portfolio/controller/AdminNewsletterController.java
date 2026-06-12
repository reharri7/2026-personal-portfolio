package com.rhettharrison.portfolio.controller;

import com.rhettharrison.portfolio.model.SendNewsletterRequest;
import com.rhettharrison.portfolio.model.SubscriberDTO;
import com.rhettharrison.portfolio.service.NewsletterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin newsletter management. Subscribers are read live from Resend; sending creates and
 * dispatches a Resend broadcast against the audience. Secured by {@code /api/admin/**} → ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin/newsletter")
@RequiredArgsConstructor
public class AdminNewsletterController {

    private final NewsletterService newsletterService;

    @GetMapping("/subscribers")
    public List<SubscriberDTO> getSubscribers() {
        return newsletterService.listSubscribers();
    }

    @PostMapping("/send")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void send(@Valid @RequestBody SendNewsletterRequest request) {
        newsletterService.sendNewsletter(request.subject(), request.html());
    }
}
