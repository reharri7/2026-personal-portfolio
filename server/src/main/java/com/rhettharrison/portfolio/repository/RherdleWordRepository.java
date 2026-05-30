package com.rhettharrison.portfolio.repository;

import com.rhettharrison.portfolio.model.RherdleWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface RherdleWordRepository extends JpaRepository<RherdleWord, Long> {
    Optional<RherdleWord> findByScheduledDate(LocalDate date);
    Optional<RherdleWord> findFirstByScheduledDateIsNullOrderById();
    Optional<RherdleWord> findByWordIgnoreCase(String word);
    List<RherdleWord> findAllByOrderByScheduledDateDescIdDesc();
    List<RherdleWord> findByScheduledDateIsNull();
}
