package com.rhettharrison.portfolio.service;

import com.rhettharrison.portfolio.model.*;
import com.rhettharrison.portfolio.repository.BlogPostRepository;
import com.rhettharrison.portfolio.repository.RherdleWordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RherdleService {

    public static final int MAX_GUESSES = 6;

    private static final String CORRECT = "CORRECT";
    private static final String PRESENT = "PRESENT";
    private static final String ABSENT = "ABSENT";

    private final RherdleWordRepository wordRepository;
    private final BlogPostRepository blogPostRepository;
    private final RherdleDictionaryService dictionary;

    // ---- Daily word resolution -------------------------------------------------

    /**
     * Returns the answer for the given date. Uses an explicitly scheduled word if one
     * exists; otherwise assigns an unused pool word to the date and persists it so the
     * puzzle stays stable for every visitor that day.
     */
    @Transactional
    public String getAnswerForDate(LocalDate date) {
        return wordRepository.findByScheduledDate(date)
            .map(RherdleWord::getWord)
            .orElseGet(() -> assignWordForDate(date));
    }

    private String assignWordForDate(LocalDate date) {
        RherdleWord pick = wordRepository.findFirstByScheduledDateIsNullOrderById()
            .orElseThrow(() -> new IllegalStateException("No Rherdle words available in the pool"));
        pick.setScheduledDate(date);
        try {
            return wordRepository.saveAndFlush(pick).getWord();
        } catch (DataIntegrityViolationException race) {
            // Another request assigned a word for this date first — re-read it.
            return wordRepository.findByScheduledDate(date)
                .map(RherdleWord::getWord)
                .orElseThrow(() -> race);
        }
    }

    public RherdleMetaDTO getDailyMeta(LocalDate date) {
        String answer = getAnswerForDate(date);
        return new RherdleMetaDTO(date.toString(), answer.length(), MAX_GUESSES);
    }

    // ---- Guessing --------------------------------------------------------------

    public RherdleGuessResponse guess(RherdleGuessRequest request) {
        String answer = resolveAnswer(request);
        if (answer == null) {
            return RherdleGuessResponse.rejected("No puzzle available");
        }

        String guess = request.guess() == null ? "" : request.guess().trim().toLowerCase();
        if (guess.length() != answer.length()) {
            return RherdleGuessResponse.rejected("Wrong length");
        }
        // The answer is always a legal guess even if it's outside the dictionary.
        if (!guess.equals(answer) && !dictionary.isRealWord(guess)) {
            return RherdleGuessResponse.rejected("Not in word list");
        }

        List<String> statuses = evaluate(answer, guess);
        boolean won = guess.equals(answer);
        return RherdleGuessResponse.evaluated(statuses, won, answer);
    }

    private String resolveAnswer(RherdleGuessRequest request) {
        String mode = request.mode() == null ? "" : request.mode().trim().toUpperCase();
        if ("BLOG".equals(mode)) {
            if (request.slug() == null || request.slug().isBlank()) {
                return null;
            }
            return blogPostRepository.findBySlugAndPublishedTrue(request.slug())
                .map(BlogPost::getRherdleWord)
                .filter(w -> w != null && !w.isBlank())
                .map(String::toLowerCase)
                .orElse(null);
        }
        // Default: DAILY
        return getAnswerForDate(LocalDate.now());
    }

    /**
     * Two-pass Wordle evaluation with correct duplicate-letter handling: greens are
     * assigned first and consume letters from the answer pool, then remaining letters
     * are matched as yellows.
     */
    List<String> evaluate(String answer, String guess) {
        int n = answer.length();
        String[] result = new String[n];
        int[] counts = new int[26];

        for (int i = 0; i < n; i++) {
            char a = answer.charAt(i);
            if (a >= 'a' && a <= 'z') counts[a - 'a']++;
        }

        // Pass 1: greens.
        for (int i = 0; i < n; i++) {
            if (guess.charAt(i) == answer.charAt(i)) {
                result[i] = CORRECT;
                char c = guess.charAt(i);
                if (c >= 'a' && c <= 'z') counts[c - 'a']--;
            }
        }

        // Pass 2: yellows / grays.
        for (int i = 0; i < n; i++) {
            if (result[i] != null) continue;
            char c = guess.charAt(i);
            int idx = (c >= 'a' && c <= 'z') ? c - 'a' : -1;
            if (idx >= 0 && counts[idx] > 0) {
                result[i] = PRESENT;
                counts[idx]--;
            } else {
                result[i] = ABSENT;
            }
        }

        List<String> list = new ArrayList<>(n);
        for (String s : result) list.add(s);
        return list;
    }

    // ---- Admin pool management -------------------------------------------------

    public List<RherdleWordDTO> listWords() {
        return wordRepository.findAllByOrderByScheduledDateDescIdDesc().stream()
            .map(RherdleWordDTO::fromEntity)
            .toList();
    }

    /** Adds one or more words (newline-separated input is split by the controller). */
    @Transactional
    public List<RherdleWordDTO> addWords(List<String> words) {
        List<RherdleWordDTO> added = new ArrayList<>();
        for (String raw : words) {
            if (raw == null) continue;
            String word = raw.trim().toLowerCase();
            if (word.isEmpty() || !word.matches("[a-z]{3,16}")) continue;
            if (wordRepository.findByWordIgnoreCase(word).isPresent()) continue;
            RherdleWord entity = new RherdleWord();
            entity.setWord(word);
            added.add(RherdleWordDTO.fromEntity(wordRepository.save(entity)));
        }
        return added;
    }

    @Transactional
    public RherdleWordDTO scheduleWord(Long id, LocalDate date) {
        RherdleWord word = wordRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Word not found"));
        // Clear any other word already on that date so the unique constraint holds.
        if (date != null) {
            wordRepository.findByScheduledDate(date).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    existing.setScheduledDate(null);
                    wordRepository.saveAndFlush(existing);
                }
            });
        }
        word.setScheduledDate(date);
        return RherdleWordDTO.fromEntity(wordRepository.save(word));
    }

    @Transactional
    public void deleteWord(Long id) {
        wordRepository.deleteById(id);
    }
}
