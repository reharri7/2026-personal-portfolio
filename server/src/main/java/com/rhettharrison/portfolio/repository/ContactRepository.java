package com.rhettharrison.portfolio.repository;

import com.rhettharrison.portfolio.model.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {
    List<Contact> findByIsReadOrderByCreatedAtDesc(Boolean isRead);
    List<Contact> findAllByOrderByCreatedAtDesc();
}
