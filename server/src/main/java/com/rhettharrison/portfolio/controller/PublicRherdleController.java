package com.rhettharrison.portfolio.controller;

import com.rhettharrison.portfolio.model.RherdleGuessRequest;
import com.rhettharrison.portfolio.model.RherdleGuessResponse;
import com.rhettharrison.portfolio.model.RherdleMetaDTO;
import com.rhettharrison.portfolio.service.RherdleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/public/rherdle")
@RequiredArgsConstructor
public class PublicRherdleController {

    private final RherdleService rherdleService;

    @GetMapping("/daily")
    public ResponseEntity<RherdleMetaDTO> getDailyMeta() {
        return ResponseEntity.ok(rherdleService.getDailyMeta(LocalDate.now()));
    }

    @PostMapping("/guess")
    public ResponseEntity<RherdleGuessResponse> guess(@Valid @RequestBody RherdleGuessRequest request) {
        return ResponseEntity.ok(rherdleService.guess(request));
    }
}
