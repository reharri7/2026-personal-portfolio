package com.rhettharrison.portfolio.model;

import jakarta.validation.constraints.*;

public record MosaicPuzzleDTO(
    Long id,
    @Size(max = 255) String slug,
    @NotBlank @Size(max = 200) String title,
    @NotBlank @Size(max = 1024) String imageUrl,
    @Min(3) @Max(5) Integer gridSize,
    Boolean published
) {
    public static MosaicPuzzleDTO fromEntity(MosaicPuzzle puzzle) {
        return new MosaicPuzzleDTO(
            puzzle.getId(),
            puzzle.getSlug(),
            puzzle.getTitle(),
            puzzle.getImageUrl(),
            puzzle.getGridSize(),
            puzzle.getPublished()
        );
    }
}
