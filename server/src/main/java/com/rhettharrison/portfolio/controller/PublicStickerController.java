package com.rhettharrison.portfolio.controller;

import com.rhettharrison.portfolio.model.StickerDTO;
import com.rhettharrison.portfolio.service.StickerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/public/stickers")
@RequiredArgsConstructor
public class PublicStickerController {

    private final StickerService stickerService;

    @GetMapping
    public ResponseEntity<List<StickerDTO>> getViewport(
        @RequestParam double minX,
        @RequestParam double minY,
        @RequestParam double maxX,
        @RequestParam double maxY
    ) {
        return ResponseEntity.ok(stickerService.getViewport(minX, minY, maxX, maxY));
    }

    @GetMapping("/{id}")
    public StickerDTO getById(@PathVariable Long id) {
        return stickerService.getApprovedById(id);
    }

    @PostMapping(value = "/preview", consumes = "multipart/form-data")
    public ResponseEntity<StickerService.PreviewResult> preview(
        @RequestParam("image") MultipartFile image
    ) {
        return ResponseEntity.ok(stickerService.preview(image));
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<StickerDTO> submit(
        @RequestParam("image") MultipartFile image,
        @RequestParam("username") String username,
        @RequestParam(value = "email", required = false) String email,
        @RequestParam(value = "message", required = false) String message,
        @RequestParam(value = "effect", required = false) String effect,
        @RequestParam("x") double x,
        @RequestParam("y") double y,
        @RequestParam(value = "rotation", defaultValue = "0") double rotation,
        @RequestParam(value = "width", required = false) Double width
    ) {
        StickerDTO created = stickerService.submit(image, username, email, message, effect, x, y, rotation, width);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
