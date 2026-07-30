package com.rhettharrison.portfolio.controller;

import com.rhettharrison.portfolio.model.MosaicPuzzleDTO;
import com.rhettharrison.portfolio.repository.MosaicPuzzleRepository;
import com.rhettharrison.portfolio.service.MosaicPuzzleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/mosaic")
@RequiredArgsConstructor
public class AdminMosaicController {

    private final MosaicPuzzleService mosaicPuzzleService;
    private final MosaicPuzzleRepository mosaicPuzzleRepository;

    @GetMapping
    public ResponseEntity<List<MosaicPuzzleDTO>> getAll() {
        return ResponseEntity.ok(mosaicPuzzleService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MosaicPuzzleDTO> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(mosaicPuzzleService.getById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody MosaicPuzzleDTO dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(mosaicPuzzleService.create(dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody MosaicPuzzleDTO dto) {
        try {
            return ResponseEntity.ok(mosaicPuzzleService.update(id, dto));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!mosaicPuzzleRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        mosaicPuzzleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
