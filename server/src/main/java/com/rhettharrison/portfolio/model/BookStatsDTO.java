package com.rhettharrison.portfolio.model;

public record BookStatsDTO(
    long totalBooks,
    long booksThisYear,
    long totalPages,
    long pagesThisYear,
    Double averageRating,
    String favoriteGenre
) {}
