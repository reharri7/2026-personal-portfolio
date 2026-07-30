package com.rhettharrison.portfolio.model;

import jakarta.validation.constraints.*;

import java.time.format.DateTimeFormatter;

public record BookDTO(
    Long id,
    @NotBlank @Size(max = 255) String title,
    @NotBlank @Size(max = 255) String author,
    @Size(max = 1024) String coverImageUrl,
    @DecimalMin("0.5") @DecimalMax("5.0") Double rating,
    String review,
    @Size(max = 500) String hotTake,
    @Size(max = 100) String genre,
    @Min(0) @Max(100000) Integer pageCount,
    @Pattern(regexp = "READING|FINISHED|DNF") String status,
    String startedAt,
    String finishedAt,
    Integer sortOrder
) {
    public static BookDTO fromEntity(Book book) {
        return new BookDTO(
            book.getId(),
            book.getTitle(),
            book.getAuthor(),
            book.getCoverImageUrl(),
            book.getRating(),
            book.getReview(),
            book.getHotTake(),
            book.getGenre(),
            book.getPageCount(),
            book.getStatus() != null ? book.getStatus().name() : null,
            book.getStartedAt() != null ? book.getStartedAt().format(DateTimeFormatter.ISO_LOCAL_DATE) : null,
            book.getFinishedAt() != null ? book.getFinishedAt().format(DateTimeFormatter.ISO_LOCAL_DATE) : null,
            book.getSortOrder()
        );
    }
}
