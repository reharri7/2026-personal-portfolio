package com.rhettharrison.portfolio.controller;

import com.rhettharrison.portfolio.model.BookDTO;
import com.rhettharrison.portfolio.model.BookStatsDTO;
import com.rhettharrison.portfolio.service.BookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/books")
@RequiredArgsConstructor
public class PublicBookController {

    private final BookService bookService;

    @GetMapping
    public ResponseEntity<List<BookDTO>> getFinishedBooks() {
        return ResponseEntity.ok(bookService.getFinishedBooks());
    }

    @GetMapping("/reading")
    public ResponseEntity<List<BookDTO>> getCurrentlyReading() {
        return ResponseEntity.ok(bookService.getCurrentlyReading());
    }

    @GetMapping("/abandoned")
    public ResponseEntity<List<BookDTO>> getAbandonedBooks() {
        return ResponseEntity.ok(bookService.getAbandonedBooks());
    }

    @GetMapping("/stats")
    public ResponseEntity<BookStatsDTO> getStats() {
        return ResponseEntity.ok(bookService.getStats());
    }
}
