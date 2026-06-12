package com.rhettharrison.portfolio.service;

import com.rhettharrison.portfolio.event.BlogPostPublishedEvent;
import com.rhettharrison.portfolio.model.BlogPost;
import com.rhettharrison.portfolio.model.BlogPostDTO;
import com.rhettharrison.portfolio.model.User;
import com.rhettharrison.portfolio.repository.BlogPostRepository;
import com.rhettharrison.portfolio.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlogPostService {

    private final BlogPostRepository blogPostRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    /** Builds the announcement event from a freshly published post. */
    private BlogPostPublishedEvent publishedEvent(BlogPost post) {
        return new BlogPostPublishedEvent(
            post.getTitle(), post.getSlug(), post.getExcerpt(), post.getCoverImageUrl());
    }

    private static final Pattern IMG_SRC_PATTERN =
        Pattern.compile("^(/uploads/|https?://).+", Pattern.CASE_INSENSITIVE);

    private static final PolicyFactory HTML_POLICY = new HtmlPolicyBuilder()
        .allowElements("p", "h1", "h2", "h3", "h4", "h5", "h6",
            "strong", "em", "u", "s", "br", "span",
            "ul", "ol", "li",
            "blockquote", "pre", "code",
            "a", "img")
        .allowUrlProtocols("http", "https")
        .allowAttributes("href").onElements("a")
        .allowAttributes("target").onElements("a")
        .allowAttributes("src").matching(IMG_SRC_PATTERN).onElements("img")
        .allowAttributes("alt").onElements("img")
        .allowAttributes("class").globally()
        .allowAttributes("style").globally()
        .toFactory();

    private String sanitizeHtml(String html) {
        if (html == null) return null;
        return HTML_POLICY.sanitize(html);
    }

    private String sanitizeImageUrl(String url) {
        if (url == null || url.isBlank()) return null;
        String trimmed = url.trim();
        return IMG_SRC_PATTERN.matcher(trimmed).matches() ? trimmed : null;
    }

    private String normalizeRherdleWord(String word) {
        if (word == null || word.isBlank()) return null;
        String normalized = word.trim().toLowerCase();
        return normalized.matches("[a-z]{3,16}") ? normalized : null;
    }

    private String generateSlug(String title) {
        String slug = title.toLowerCase().trim()
            .replaceAll("[^\\w\\s-]", "")
            .replaceAll("[\\s_-]+", "-")
            .replaceAll("^-+|-+$", "");

        String baseSlug = slug;
        int counter = 1;
        while (blogPostRepository.findBySlug(slug).isPresent()) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        return slug;
    }

    @Transactional
    public BlogPostDTO createPost(BlogPostDTO dto) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User author = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        BlogPost post = new BlogPost();
        post.setTitle(dto.title());
        post.setSlug(dto.slug() != null && !dto.slug().isBlank() ? dto.slug() : generateSlug(dto.title()));
        post.setExcerpt(dto.excerpt());
        post.setContent(sanitizeHtml(dto.content()));
        post.setTags(dto.tags() != null ? String.join(",", dto.tags()) : null);
        post.setCoverImageUrl(sanitizeImageUrl(dto.coverImageUrl()));
        post.setRherdleWord(normalizeRherdleWord(dto.rherdleWord()));
        post.setPublished(dto.published() != null ? dto.published() : false);
        post.setAuthor(author);

        if (Boolean.TRUE.equals(post.getPublished())) {
            post.setPublishedAt(LocalDateTime.now());
        }

        BlogPost saved = blogPostRepository.save(post);
        if (Boolean.TRUE.equals(saved.getPublished())) {
            // Announced to subscribers after commit by EmailListener.
            eventPublisher.publishEvent(publishedEvent(saved));
        }
        return BlogPostDTO.fromEntityAdmin(saved);
    }

    @Transactional
    public BlogPostDTO updatePost(Long id, BlogPostDTO dto) {
        BlogPost post = blogPostRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Post not found"));

        post.setTitle(dto.title());
        if (dto.slug() != null && !dto.slug().isBlank()) {
            blogPostRepository.findBySlug(dto.slug()).ifPresent(existing -> {
                if (!existing.getId().equals(id)) {
                    throw new RuntimeException("Slug already in use");
                }
            });
            post.setSlug(dto.slug());
        }
        post.setExcerpt(dto.excerpt());
        post.setContent(sanitizeHtml(dto.content()));
        post.setTags(dto.tags() != null ? String.join(",", dto.tags()) : null);
        post.setCoverImageUrl(sanitizeImageUrl(dto.coverImageUrl()));
        post.setRherdleWord(normalizeRherdleWord(dto.rherdleWord()));

        boolean wasPublished = Boolean.TRUE.equals(post.getPublished());
        post.setPublished(dto.published() != null ? dto.published() : false);
        boolean nowPublished = Boolean.TRUE.equals(post.getPublished());
        if (nowPublished && !wasPublished) {
            post.setPublishedAt(LocalDateTime.now());
        } else if (Boolean.FALSE.equals(post.getPublished())) {
            post.setPublishedAt(null);
        }

        BlogPost saved = blogPostRepository.save(post);
        // Announce only on the false->true transition, so re-saving a live post sends nothing.
        if (nowPublished && !wasPublished) {
            eventPublisher.publishEvent(publishedEvent(saved));
        }
        return BlogPostDTO.fromEntityAdmin(saved);
    }

    public void deletePost(Long id) {
        blogPostRepository.deleteById(id);
    }

    public List<BlogPostDTO> getPublishedPosts() {
        return blogPostRepository.findByPublishedTrueOrderByPublishedAtDesc().stream()
            .map(BlogPostDTO::fromEntity)
            .toList();
    }

    public BlogPostDTO getPostBySlug(String slug) {
        BlogPost post = blogPostRepository.findBySlugAndPublishedTrue(slug)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        return BlogPostDTO.fromEntity(post);
    }

    public List<BlogPostDTO> getAllPosts() {
        return blogPostRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(BlogPostDTO::fromEntityAdmin)
            .toList();
    }

    public BlogPostDTO getPostById(Long id) {
        BlogPost post = blogPostRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Post not found"));
        return BlogPostDTO.fromEntityAdmin(post);
    }

    public List<String> getAllTags() {
        return blogPostRepository.findByPublishedTrueOrderByPublishedAtDesc().stream()
            .map(BlogPost::getTags)
            .filter(tags -> tags != null && !tags.isBlank())
            .flatMap(tags -> Arrays.stream(tags.split(",")))
            .map(String::trim)
            .filter(tag -> !tag.isEmpty())
            .distinct()
            .sorted()
            .collect(Collectors.toList());
    }
}
