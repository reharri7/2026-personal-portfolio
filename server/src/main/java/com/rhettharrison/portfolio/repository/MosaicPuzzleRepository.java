package com.rhettharrison.portfolio.repository;

import com.rhettharrison.portfolio.model.MosaicPuzzle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MosaicPuzzleRepository extends JpaRepository<MosaicPuzzle, Long> {

    Optional<MosaicPuzzle> findBySlug(String slug);

    Optional<MosaicPuzzle> findBySlugAndPublishedTrue(String slug);

    List<MosaicPuzzle> findByPublishedTrueOrderByCreatedAtDesc();

    List<MosaicPuzzle> findAllByOrderByCreatedAtDesc();

    boolean existsBySlug(String slug);
}
