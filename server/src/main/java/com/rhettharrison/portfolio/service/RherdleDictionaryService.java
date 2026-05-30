package com.rhettharrison.portfolio.service;

import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

/**
 * Loads bundled word lists used to validate that a guess is a real word.
 * Currently ships a 5-letter list (the standard puzzle length). For lengths
 * with no bundled list, validation falls back to length-only (handled by callers).
 */
@Service
public class RherdleDictionaryService {

    private final Set<String> fiveLetterWords = new HashSet<>();

    @PostConstruct
    void load() {
        ClassPathResource resource = new ClassPathResource("rherdle/valid-guesses-5.txt");
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String word = line.trim().toLowerCase();
                if (!word.isEmpty()) {
                    fiveLetterWords.add(word);
                }
            }
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load Rherdle dictionary", e);
        }
    }

    /** Whether we have a dictionary for the given word length. */
    public boolean hasDictionaryFor(int length) {
        return length == 5;
    }

    /** True if {@code guess} (case-insensitive) is a real word of its length. */
    public boolean isRealWord(String guess) {
        if (guess == null) return false;
        String w = guess.trim().toLowerCase();
        if (w.length() == 5) {
            return fiveLetterWords.contains(w);
        }
        // No dictionary for this length — accept by length only.
        return true;
    }
}
