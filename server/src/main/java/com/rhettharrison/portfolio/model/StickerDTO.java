package com.rhettharrison.portfolio.model;

public record StickerDTO(
    Long id,
    String imageUrl,
    String blurDataUrl,
    String username,
    String message,
    String effect,
    Double x,
    Double y,
    Double width,
    Double height,
    Double rotation,
    String alphaMask,
    String status,
    String createdAt,
    String approvedAt
) {
    public static StickerDTO fromEntity(Sticker s) {
        return new StickerDTO(
            s.getId(),
            s.getImagePath() == null ? null : "/uploads/stickers/" + s.getImagePath(),
            s.getBlurDataUrl(),
            s.getUsername(),
            s.getMessage(),
            s.getEffect(),
            s.getX(),
            s.getY(),
            s.getWidth(),
            s.getHeight(),
            s.getRotation(),
            s.getAlphaMask(),
            s.getStatus() == null ? null : s.getStatus().name().toLowerCase(),
            s.getCreatedAt() == null ? null : s.getCreatedAt().toString(),
            s.getApprovedAt() == null ? null : s.getApprovedAt().toString()
        );
    }

    /** Strip personal/image fields for pending stickers exposed to the public viewport. */
    public StickerDTO stripped() {
        return new StickerDTO(
            id, null, null, "", null, null,
            x, y, width, height, rotation, alphaMask,
            status, null, null
        );
    }
}
