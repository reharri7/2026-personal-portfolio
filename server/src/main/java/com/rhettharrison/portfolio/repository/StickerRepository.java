package com.rhettharrison.portfolio.repository;

import com.rhettharrison.portfolio.model.Sticker;
import com.rhettharrison.portfolio.model.StickerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StickerRepository extends JpaRepository<Sticker, Long> {

    List<Sticker> findByStatusOrderByCreatedAtDesc(StickerStatus status);

    List<Sticker> findByStatusInOrderByCreatedAtAsc(List<StickerStatus> statuses);

    @Query("""
        SELECT s FROM Sticker s
        WHERE s.status IN :statuses
          AND s.x + s.width >= :minX
          AND s.x <= :maxX
          AND s.y + s.height >= :minY
          AND s.y <= :maxY
        ORDER BY s.createdAt ASC
    """)
    List<Sticker> findInViewport(
        @Param("statuses") List<StickerStatus> statuses,
        @Param("minX") double minX,
        @Param("minY") double minY,
        @Param("maxX") double maxX,
        @Param("maxY") double maxY
    );

    @Query("""
        SELECT s FROM Sticker s
        WHERE s.status IN :statuses
          AND s.x BETWEEN :minX AND :maxX
          AND s.y BETWEEN :minY AND :maxY
    """)
    List<Sticker> findNearby(
        @Param("statuses") List<StickerStatus> statuses,
        @Param("minX") double minX,
        @Param("minY") double minY,
        @Param("maxX") double maxX,
        @Param("maxY") double maxY
    );
}
