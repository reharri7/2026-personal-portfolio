package com.rhettharrison.portfolio.service;

import com.rhettharrison.portfolio.model.Sticker;
import com.rhettharrison.portfolio.model.StickerDTO;
import com.rhettharrison.portfolio.model.StickerStatus;
import com.rhettharrison.portfolio.repository.StickerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
public class StickerService {

    private static final Set<String> ALLOWED_EFFECTS = Set.of(
        "rainbow", "shimmer", "holo", "glitter"
    );
    private static final long MAX_UPLOAD_BYTES = 20L * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of(
        "image/png", "image/jpeg", "image/jpg", "image/webp"
    );

    private final StickerRepository repo;
    private final StickerImageProcessor processor;
    private final FileStorageService fileStorage;

    public List<StickerDTO> getViewport(double minX, double minY, double maxX, double maxY) {
        List<Sticker> rows = repo.findInViewport(
            List.of(StickerStatus.APPROVED, StickerStatus.PENDING),
            minX, minY, maxX, maxY
        );
        return rows.stream()
            .map(StickerDTO::fromEntity)
            .map(dto -> "pending".equals(dto.status()) ? dto.stripped() : dto)
            .toList();
    }

    public List<StickerDTO> getPending() {
        return repo.findByStatusOrderByCreatedAtDesc(StickerStatus.PENDING)
            .stream().map(StickerDTO::fromEntity).toList();
    }

    public record PreviewResult(
        String imageDataUrl,
        double width,
        double height,
        String alphaMask,
        String blurDataUrl
    ) {}

    /**
     * Run the same image-processing pipeline as submit(), but don't save
     * anything. Returns the processed PNG as a base64 data URL so the
     * client can show it as the placement preview before committing.
     */
    public PreviewResult preview(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image is required");
        }
        if (image.getSize() > MAX_UPLOAD_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image exceeds 20 MB");
        }
        String contentType = image.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "Unsupported image type: " + contentType);
        }
        StickerImageProcessor.Result processed;
        try {
            processed = processor.process(image.getBytes());
        } catch (java.io.IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read image", e);
        } catch (Exception e) {
            log.error("Preview processing failed", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Image processing failed");
        }
        if (processed.pngBytes().length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Could not extract a subject from this image");
        }
        String dataUrl = "data:image/png;base64," +
            java.util.Base64.getEncoder().encodeToString(processed.pngBytes());
        return new PreviewResult(dataUrl, processed.width(), processed.height(),
            processed.alphaMask(), processed.blurDataUrl());
    }

    public List<StickerDTO> getAll() {
        return repo.findAll().stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .map(StickerDTO::fromEntity)
            .toList();
    }

    @Transactional
    public void delete(Long id) {
        Sticker s = repo.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Sticker not found"));
        fileStorage.deleteStickerFile(s.getImagePath());
        repo.delete(s);
    }

    @Transactional
    public StickerDTO submit(
        MultipartFile image,
        String username,
        String message,
        String effect,
        double x,
        double y,
        double rotation,
        Double targetWidth
    ) {
        if (image == null || image.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image is required");
        }
        if (image.getSize() > MAX_UPLOAD_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image exceeds 20 MB");
        }
        String contentType = image.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "Unsupported image type: " + contentType);
        }
        if (username == null || username.isBlank() || username.length() > 30) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Username must be 1-30 characters");
        }
        if (message != null && message.length() > 200) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message exceeds 200 chars");
        }
        String effectClean = (effect == null || effect.isBlank()) ? null : effect.toLowerCase();
        if (effectClean != null && !ALLOWED_EFFECTS.contains(effectClean)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid effect: " + effect);
        }

        StickerImageProcessor.Result processed;
        try {
            processed = processor.process(image.getBytes());
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read image", e);
        } catch (Exception e) {
            log.error("Image processing failed", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Image processing failed");
        }

        if (processed.pngBytes().length == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Could not extract a subject from this image");
        }

        double width = processed.width();
        double height = processed.height();
        if (targetWidth != null && targetWidth > 0 && width > 0) {
            double scale = targetWidth / width;
            width = targetWidth;
            height = height * scale;
        }

        // Rotation-aware overlap check. The previous SQL pre-filter (by
        // top-left position) missed partially-overlapping stickers whose
        // top-left fell outside the candidate's neighbourhood — and the
        // mask comparison ignored rotation entirely. Load every active
        // sticker and let the rotation-aware test in StickerOverlapUtil
        // decide. Fine for portfolio scale; revisit if the table grows.
        double normRot = normalizeRotation(rotation);
        var existing = repo.findByStatusInOrderByCreatedAtAsc(
            List.of(StickerStatus.APPROVED, StickerStatus.PENDING));
        for (var s : existing) {
            double ratio = StickerOverlapUtil.computeAlphaOverlapRatio(
                x, y, width, height, normRot, processed.alphaMask(),
                s.getX(), s.getY(), s.getWidth(), s.getHeight(), s.getRotation(), s.getAlphaMask()
            );
            if (ratio > StickerOverlapUtil.MAX_OVERLAP_RATIO) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Sticker overlaps too much with an existing sticker");
            }
        }

        FileStorageService.StoredFile stored;
        try {
            stored = fileStorage.storeStickerPng(processed.pngBytes());
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store image");
        }

        Sticker s = new Sticker();
        s.setImagePath(stored.filename());
        s.setBlurDataUrl(processed.blurDataUrl());
        s.setUsername(username.trim());
        s.setMessage(message == null || message.isBlank() ? null : message.trim());
        s.setEffect(effectClean);
        s.setX(x);
        s.setY(y);
        s.setWidth(width);
        s.setHeight(height);
        s.setRotation(normalizeRotation(rotation));
        s.setAlphaMask(processed.alphaMask());
        s.setStatus(StickerStatus.PENDING);
        repo.save(s);
        return StickerDTO.fromEntity(s);
    }

    @Transactional
    public StickerDTO moderate(Long id, StickerStatus status) {
        Sticker s = repo.findById(id).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.NOT_FOUND, "Sticker not found"));
        if (status == StickerStatus.APPROVED) {
            s.setStatus(StickerStatus.APPROVED);
            s.setApprovedAt(LocalDateTime.now());
            repo.save(s);
            return StickerDTO.fromEntity(s);
        }
        if (status == StickerStatus.REJECTED) {
            fileStorage.deleteStickerFile(s.getImagePath());
            repo.delete(s);
            return new StickerDTO(id, null, null, null, null, null,
                null, null, null, null, null, null, "rejected", null, null);
        }
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be approved or rejected");
    }

    private static double normalizeRotation(double r) {
        double n = r % 360.0;
        if (n < 0) n += 360.0;
        return n;
    }
}
