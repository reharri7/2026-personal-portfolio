package com.rhettharrison.portfolio.controller;

import com.rhettharrison.portfolio.model.RherdleWordDTO;
import com.rhettharrison.portfolio.service.RherdleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/rherdle")
@RequiredArgsConstructor
public class AdminRherdleController {

    private final RherdleService rherdleService;

    @GetMapping("/words")
    public ResponseEntity<List<RherdleWordDTO>> listWords() {
        return ResponseEntity.ok(rherdleService.listWords());
    }

    /** Body: {"words": "crane\nslate\n..."} or {"words": ["crane", "slate"]}. */
    @PostMapping("/words")
    public ResponseEntity<List<RherdleWordDTO>> addWords(@RequestBody Map<String, Object> body) {
        Object raw = body.get("words");
        List<String> words;
        if (raw instanceof List<?> list) {
            words = list.stream().map(String::valueOf).toList();
        } else {
            words = Arrays.asList(String.valueOf(raw).split("[\\r\\n,]+"));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(rherdleService.addWords(words));
    }

    /** Body: {"date": "2026-06-01"} or {"date": null} to unschedule. */
    @PutMapping("/words/{id}/schedule")
    public ResponseEntity<RherdleWordDTO> scheduleWord(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String dateStr = body.get("date");
        LocalDate date = (dateStr == null || dateStr.isBlank()) ? null : LocalDate.parse(dateStr);
        try {
            return ResponseEntity.ok(rherdleService.scheduleWord(id, date));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/words/{id}")
    public ResponseEntity<Void> deleteWord(@PathVariable Long id) {
        rherdleService.deleteWord(id);
        return ResponseEntity.noContent().build();
    }
}
