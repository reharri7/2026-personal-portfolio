package com.rhettharrison.portfolio.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record BlogPostDTO(
    Long id,
    @NotBlank @Size(max = 255) String title,
    @Size(max = 255) @Pattern(regexp = "^$|^[a-z0-9-]+$") String slug,
    @Size(max = 1000) String excerpt,
    String content,
    List<@Size(max = 50) String> tags,
    @Size(max = 1024) String coverImageUrl,
    String date,
    Boolean published,
    String authorName
) {
    public static BlogPostDTO fromEntity(BlogPost post) {
        List<String> tagList = List.of();
        if (post.getTags() != null && !post.getTags().isBlank()) {
            tagList = List.of(post.getTags().split(",")).stream()
                .map(String::trim)
                .filter(t -> !t.isEmpty())
                .toList();
        }

        String date = post.getPublishedAt() != null
            ? post.getPublishedAt().toLocalDate().toString()
            : post.getCreatedAt().toLocalDate().toString();

        String authorName = post.getAuthor() != null
            ? post.getAuthor().getDisplayName()
            : null;

        return new BlogPostDTO(
            post.getId(),
            post.getTitle(),
            post.getSlug(),
            post.getExcerpt(),
            post.getContent(),
            tagList,
            post.getCoverImageUrl(),
            date,
            post.getPublished(),
            authorName
        );
    }
}
