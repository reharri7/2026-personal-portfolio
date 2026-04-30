package com.rhettharrison.portfolio.controller;

import com.rhettharrison.portfolio.model.BlogPostDTO;
import com.rhettharrison.portfolio.repository.BlogPostRepository;
import com.rhettharrison.portfolio.service.BlogPostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/blog")
@RequiredArgsConstructor
public class AdminBlogController {

    private final BlogPostService blogPostService;
    private final BlogPostRepository blogPostRepository;

    @GetMapping
    public ResponseEntity<List<BlogPostDTO>> getAllPosts() {
        return ResponseEntity.ok(blogPostService.getAllPosts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BlogPostDTO> getPostById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(blogPostService.getPostById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<BlogPostDTO> createPost(@Valid @RequestBody BlogPostDTO post) {
        BlogPostDTO created = blogPostService.createPost(post);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BlogPostDTO> updatePost(@PathVariable Long id, @Valid @RequestBody BlogPostDTO post) {
        try {
            return ResponseEntity.ok(blogPostService.updatePost(id, post));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        if (!blogPostRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        blogPostService.deletePost(id);
        return ResponseEntity.noContent().build();
    }
}
