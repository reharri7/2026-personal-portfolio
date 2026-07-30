package com.rhettharrison.portfolio.controller;

import com.rhettharrison.portfolio.model.MosaicPuzzleDTO;
import com.rhettharrison.portfolio.service.MosaicPuzzleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/mosaic")
@RequiredArgsConstructor
public class PublicMosaicController {

    private final MosaicPuzzleService mosaicPuzzleService;

    @GetMapping
    public ResponseEntity<List<MosaicPuzzleDTO>> getPublished() {
        return ResponseEntity.ok(mosaicPuzzleService.getPublished());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<MosaicPuzzleDTO> getBySlug(@PathVariable String slug) {
        try {
            return ResponseEntity.ok(mosaicPuzzleService.getBySlug(slug));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
