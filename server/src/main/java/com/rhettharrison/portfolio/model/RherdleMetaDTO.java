package com.rhettharrison.portfolio.model;

/**
 * Public-safe puzzle metadata. Deliberately excludes the answer.
 */
public record RherdleMetaDTO(
    String puzzleDate,
    int length,
    int maxGuesses
) {}
