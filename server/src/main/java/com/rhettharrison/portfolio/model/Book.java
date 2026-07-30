package com.rhettharrison.portfolio.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "books")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    @Column(length = 1024)
    private String coverImageUrl;

    /** 0.5–5.0 in half steps; null for currently-reading or abandoned books with no verdict. */
    private Double rating;

    @Column(columnDefinition = "TEXT")
    private String review;

    /** Short, punchy one-liner shown on the card. */
    @Column(length = 500)
    private String hotTake;

    @Column(length = 100)
    private String genre;

    private Integer pageCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private BookStatus status = BookStatus.FINISHED;

    private LocalDate startedAt;

    private LocalDate finishedAt;

    /** Manual ordering knob for the admin; lower sorts first within a shelf. */
    @Column(nullable = false)
    private Integer sortOrder = 0;

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
