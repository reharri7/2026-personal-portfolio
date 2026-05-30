package com.rhettharrison.portfolio.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "stickers", indexes = {
    @Index(name = "idx_stickers_status", columnList = "status"),
    @Index(name = "idx_stickers_x_y", columnList = "x,y")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Sticker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "image_path", nullable = false, length = 512)
    private String imagePath;

    @Column(name = "blur_data_url", columnDefinition = "TEXT")
    private String blurDataUrl;

    @Column(nullable = false, length = 30)
    private String username;

    @Column(length = 200)
    private String message;

    @Column(length = 32)
    private String effect;

    @Column(nullable = false)
    private Double x;

    @Column(nullable = false)
    private Double y;

    @Column(nullable = false)
    private Double width;

    @Column(nullable = false)
    private Double height;

    @Column(nullable = false)
    private Double rotation;

    @Column(name = "alpha_mask", columnDefinition = "TEXT")
    private String alphaMask;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private StickerStatus status = StickerStatus.PENDING;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = StickerStatus.PENDING;
    }
}
