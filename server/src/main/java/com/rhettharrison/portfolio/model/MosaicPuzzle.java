package com.rhettharrison.portfolio.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "mosaic_puzzles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MosaicPuzzle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(name = "image_url", nullable = false, length = 1024)
    private String imageUrl;

    /** Tiles per side: 3, 4 or 5. */
    @Column(name = "grid_size", nullable = false)
    private Integer gridSize = 4;

    /** Whether the puzzle is shown on the public /fun/mosaic page. */
    @Column(nullable = false)
    private Boolean published = true;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
