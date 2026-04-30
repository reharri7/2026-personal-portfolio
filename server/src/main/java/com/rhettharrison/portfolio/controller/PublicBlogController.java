package com.rhettharrison.portfolio.controller;

import com.rhettharrison.portfolio.model.BlogPostDTO;
import com.rhettharrison.portfolio.service.BlogPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/blog")
@RequiredArgsConstructor
public class PublicBlogController {

    private final BlogPostService blogPostService;

    @GetMapping
    public ResponseEntity<List<BlogPostDTO>> getPublishedPosts() {
        return ResponseEntity.ok(blogPostService.getPublishedPosts());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<BlogPostDTO> getPostBySlug(@PathVariable String slug) {
        try {
            return ResponseEntity.ok(blogPostService.getPostBySlug(slug));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/tags")
    public ResponseEntity<List<String>> getAllTags() {
        return ResponseEntity.ok(blogPostService.getAllTags());
    }
}
