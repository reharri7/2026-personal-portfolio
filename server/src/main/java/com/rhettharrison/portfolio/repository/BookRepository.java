package com.rhettharrison.portfolio.repository;

import com.rhettharrison.portfolio.model.Book;
import com.rhettharrison.portfolio.model.BookStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {

    /** Finished books, newest read first; the manual sortOrder breaks ties. */
    List<Book> findByStatusOrderByFinishedAtDescSortOrderAsc(BookStatus status);

    /** Currently-reading / abandoned shelves, ordered by when they were started. */
    List<Book> findByStatusOrderByStartedAtDescSortOrderAsc(BookStatus status);

    List<Book> findAllByOrderBySortOrderAscCreatedAtDesc();
}
