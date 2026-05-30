package com.rhettharrison.portfolio.controller;

import com.rhettharrison.portfolio.model.AnalyticsEventRequest;
import com.rhettharrison.portfolio.service.AnalyticsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/analytics")
@RequiredArgsConstructor
public class PublicAnalyticsController {

    private final AnalyticsService analyticsService;

    @PostMapping("/collect")
    public ResponseEntity<Void> collect(@Valid @RequestBody AnalyticsEventRequest request,
                                        HttpServletRequest httpRequest) {
        analyticsService.record(request, httpRequest);
        return ResponseEntity.noContent().build();
    }
}
