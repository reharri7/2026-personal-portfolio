package com.rhettharrison.portfolio.controller;

import com.rhettharrison.portfolio.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            FileStorageService.StoredFile stored = fileStorageService.storeBlogImage(file);
            return ResponseEntity.ok(Map.of("url", stored.url()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to store file"));
        }
    }
}
