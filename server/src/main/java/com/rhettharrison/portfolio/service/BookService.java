package com.rhettharrison.portfolio.service;

import com.rhettharrison.portfolio.model.Book;
import com.rhettharrison.portfolio.model.BookDTO;
import com.rhettharrison.portfolio.model.BookStatsDTO;
import com.rhettharrison.portfolio.model.BookStatus;
import com.rhettharrison.portfolio.repository.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;

    private static final Pattern IMG_SRC_PATTERN =
        Pattern.compile("^(/uploads/|https?://).+", Pattern.CASE_INSENSITIVE);

    private String sanitizeImageUrl(String url) {
        if (url == null || url.isBlank()) return null;
        String trimmed = url.trim();
        return IMG_SRC_PATTERN.matcher(trimmed).matches() ? trimmed : null;
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        return LocalDate.parse(value.trim());
    }

    private void apply(Book book, BookDTO dto) {
        book.setTitle(dto.title());
        book.setAuthor(dto.author());
        book.setCoverImageUrl(sanitizeImageUrl(dto.coverImageUrl()));
        book.setRating(dto.rating());
        book.setReview(dto.review());
        book.setHotTake(dto.hotTake());
        book.setGenre(dto.genre());
        book.setPageCount(dto.pageCount());
        book.setStatus(dto.status() != null ? BookStatus.valueOf(dto.status()) : BookStatus.FINISHED);
        book.setStartedAt(parseDate(dto.startedAt()));
        book.setFinishedAt(parseDate(dto.finishedAt()));
        book.setSortOrder(dto.sortOrder() != null ? dto.sortOrder() : 0);
    }

    @Transactional
    public BookDTO createBook(BookDTO dto) {
        Book book = new Book();
        apply(book, dto);
        return BookDTO.fromEntity(bookRepository.save(book));
    }

    @Transactional
    public BookDTO updateBook(Long id, BookDTO dto) {
        Book book = bookRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Book not found"));
        apply(book, dto);
        return BookDTO.fromEntity(bookRepository.save(book));
    }

    public void deleteBook(Long id) {
        bookRepository.deleteById(id);
    }

    // ---- Public reads ----

    public List<BookDTO> getFinishedBooks() {
        return bookRepository.findByStatusOrderByFinishedAtDescSortOrderAsc(BookStatus.FINISHED).stream()
            .map(BookDTO::fromEntity)
            .toList();
    }

    public List<BookDTO> getCurrentlyReading() {
        return bookRepository.findByStatusOrderByStartedAtDescSortOrderAsc(BookStatus.READING).stream()
            .map(BookDTO::fromEntity)
            .toList();
    }

    public List<BookDTO> getAbandonedBooks() {
        return bookRepository.findByStatusOrderByStartedAtDescSortOrderAsc(BookStatus.DNF).stream()
            .map(BookDTO::fromEntity)
            .toList();
    }

    // ---- Admin reads ----

    public List<BookDTO> getAllBooks() {
        return bookRepository.findAllByOrderBySortOrderAscCreatedAtDesc().stream()
            .map(BookDTO::fromEntity)
            .toList();
    }

    public BookDTO getBookById(Long id) {
        Book book = bookRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Book not found"));
        return BookDTO.fromEntity(book);
    }

    // ---- Stats banner ----

    public BookStatsDTO getStats() {
        List<Book> finished = bookRepository.findByStatusOrderByFinishedAtDescSortOrderAsc(BookStatus.FINISHED);
        int currentYear = LocalDate.now().getYear();

        long totalBooks = finished.size();
        long booksThisYear = finished.stream()
            .filter(b -> b.getFinishedAt() != null && b.getFinishedAt().getYear() == currentYear)
            .count();

        long totalPages = finished.stream()
            .filter(b -> b.getPageCount() != null)
            .mapToLong(Book::getPageCount)
            .sum();
        long pagesThisYear = finished.stream()
            .filter(b -> b.getPageCount() != null && b.getFinishedAt() != null
                && b.getFinishedAt().getYear() == currentYear)
            .mapToLong(Book::getPageCount)
            .sum();

        java.util.OptionalDouble avg = finished.stream()
            .filter(b -> b.getRating() != null)
            .mapToDouble(Book::getRating)
            .average();
        Double averageRating = avg.isPresent() ? Math.round(avg.getAsDouble() * 10.0) / 10.0 : null;

        String favoriteGenre = finished.stream()
            .map(Book::getGenre)
            .filter(g -> g != null && !g.isBlank())
            .collect(Collectors.groupingBy(g -> g, Collectors.counting()))
            .entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(null);

        return new BookStatsDTO(totalBooks, booksThisYear, totalPages, pagesThisYear, averageRating, favoriteGenre);
    }
}
