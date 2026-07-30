package com.rhettharrison.portfolio.service;

import com.rhettharrison.portfolio.model.MosaicPuzzle;
import com.rhettharrison.portfolio.model.MosaicPuzzleDTO;
import com.rhettharrison.portfolio.repository.MosaicPuzzleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class MosaicPuzzleService {

    private final MosaicPuzzleRepository mosaicPuzzleRepository;

    private static final Pattern IMG_SRC_PATTERN =
        Pattern.compile("^(/uploads/|https?://).+", Pattern.CASE_INSENSITIVE);

    private String sanitizeImageUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("Image is required");
        }
        String trimmed = url.trim();
        if (!IMG_SRC_PATTERN.matcher(trimmed).matches()) {
            throw new IllegalArgumentException("Invalid image URL");
        }
        return trimmed;
    }

    private int normalizeGridSize(Integer gridSize) {
        int size = gridSize != null ? gridSize : 4;
        if (size < 3 || size > 5) {
            throw new IllegalArgumentException("Grid size must be 3, 4 or 5");
        }
        return size;
    }

    /** Generates a unique kebab-case slug from the title, skipping a given id when updating. */
    private String generateSlug(String title, Long ignoreId) {
        String base = title.toLowerCase().trim()
            .replaceAll("[^\\w\\s-]", "")
            .replaceAll("[\\s_-]+", "-")
            .replaceAll("^-+|-+$", "");
        if (base.isBlank()) base = "puzzle";

        String slug = base;
        int counter = 1;
        while (true) {
            var existing = mosaicPuzzleRepository.findBySlug(slug);
            if (existing.isEmpty() || existing.get().getId().equals(ignoreId)) {
                return slug;
            }
            slug = base + "-" + counter++;
        }
    }

    @Transactional
    public MosaicPuzzleDTO create(MosaicPuzzleDTO dto) {
        MosaicPuzzle puzzle = new MosaicPuzzle();
        puzzle.setTitle(dto.title().trim());
        puzzle.setImageUrl(sanitizeImageUrl(dto.imageUrl()));
        puzzle.setGridSize(normalizeGridSize(dto.gridSize()));
        puzzle.setPublished(dto.published() == null || dto.published());
        puzzle.setSlug(generateSlug(dto.title(), null));
        return MosaicPuzzleDTO.fromEntity(mosaicPuzzleRepository.save(puzzle));
    }

    @Transactional
    public MosaicPuzzleDTO update(Long id, MosaicPuzzleDTO dto) {
        MosaicPuzzle puzzle = mosaicPuzzleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Mosaic puzzle not found"));
        boolean titleChanged = !puzzle.getTitle().equals(dto.title().trim());
        puzzle.setTitle(dto.title().trim());
        puzzle.setImageUrl(sanitizeImageUrl(dto.imageUrl()));
        puzzle.setGridSize(normalizeGridSize(dto.gridSize()));
        puzzle.setPublished(dto.published() == null || dto.published());
        if (titleChanged) {
            puzzle.setSlug(generateSlug(dto.title(), id));
        }
        return MosaicPuzzleDTO.fromEntity(mosaicPuzzleRepository.save(puzzle));
    }

    public void delete(Long id) {
        mosaicPuzzleRepository.deleteById(id);
    }

    // ---- Public reads ----

    public List<MosaicPuzzleDTO> getPublished() {
        return mosaicPuzzleRepository.findByPublishedTrueOrderByCreatedAtDesc().stream()
            .map(MosaicPuzzleDTO::fromEntity)
            .toList();
    }

    public MosaicPuzzleDTO getBySlug(String slug) {
        MosaicPuzzle puzzle = mosaicPuzzleRepository.findBySlugAndPublishedTrue(slug)
            .orElseThrow(() -> new RuntimeException("Mosaic puzzle not found"));
        return MosaicPuzzleDTO.fromEntity(puzzle);
    }

    // ---- Admin reads ----

    public List<MosaicPuzzleDTO> getAll() {
        return mosaicPuzzleRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(MosaicPuzzleDTO::fromEntity)
            .toList();
    }

    public MosaicPuzzleDTO getById(Long id) {
        MosaicPuzzle puzzle = mosaicPuzzleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Mosaic puzzle not found"));
        return MosaicPuzzleDTO.fromEntity(puzzle);
    }
}
