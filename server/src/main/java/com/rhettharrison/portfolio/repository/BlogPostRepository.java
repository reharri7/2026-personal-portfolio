package com.rhettharrison.portfolio.repository;

import com.rhettharrison.portfolio.model.BlogPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    List<BlogPost> findByPublishedTrueOrderByPublishedAtDesc();
    Optional<BlogPost> findBySlugAndPublishedTrue(String slug);
    Optional<BlogPost> findBySlug(String slug);
    List<BlogPost> findAllByOrderByCreatedAtDesc();
}
