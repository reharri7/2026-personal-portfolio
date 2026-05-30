package com.rhettharrison.portfolio.controller;

import com.rhettharrison.portfolio.model.StickerDTO;
import com.rhettharrison.portfolio.model.StickerStatus;
import com.rhettharrison.portfolio.service.StickerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/stickers")
@RequiredArgsConstructor
public class AdminStickerController {

    private final StickerService stickerService;

    @GetMapping
    public ResponseEntity<List<StickerDTO>> list(
        @RequestParam(value = "status", required = false) String status
    ) {
        if ("all".equalsIgnoreCase(status)) {
            return ResponseEntity.ok(stickerService.getAll());
        }
        return ResponseEntity.ok(stickerService.getPending());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        stickerService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<StickerDTO> moderate(
        @PathVariable Long id,
        @RequestBody Map<String, String> body
    ) {
        String raw = body.getOrDefault("status", "");
        StickerStatus status;
        try {
            status = StickerStatus.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "status must be 'approved' or 'rejected'");
        }
        return ResponseEntity.ok(stickerService.moderate(id, status));
    }

    public record PositionUpdate(Double x, Double y, Double rotation) {}

    @PatchMapping("/{id}/position")
    public ResponseEntity<StickerDTO> updatePosition(
        @PathVariable Long id,
        @RequestBody PositionUpdate body
    ) {
        if (body.x() == null || body.y() == null || body.rotation() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "x, y and rotation are required");
        }
        return ResponseEntity.ok(stickerService.updatePosition(id, body.x(), body.y(), body.rotation()));
    }
}
