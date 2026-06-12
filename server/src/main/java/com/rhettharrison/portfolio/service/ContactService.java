package com.rhettharrison.portfolio.service;

import com.rhettharrison.portfolio.event.ContactSubmittedEvent;
import com.rhettharrison.portfolio.model.Contact;
import com.rhettharrison.portfolio.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactRepository contactRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Contact createContact(Contact contact) {
        Contact saved = contactRepository.save(contact);
        // Emailed after commit by EmailListener (admin notification + sender acknowledgement).
        eventPublisher.publishEvent(new ContactSubmittedEvent(saved));
        return saved;
    }
    
    public List<Contact> getAllContacts() {
        return contactRepository.findAllByOrderByCreatedAtDesc();
    }
    
    public List<Contact> getUnreadContacts() {
        return contactRepository.findByIsReadOrderByCreatedAtDesc(false);
    }
    
    public List<Contact> getReadContacts() {
        return contactRepository.findByIsReadOrderByCreatedAtDesc(true);
    }
    
    public Optional<Contact> getContactById(Long id) {
        return contactRepository.findById(id);
    }
    
    @Transactional
    public Contact markAsRead(Long id) {
        Contact contact = contactRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Contact not found"));
        contact.setIsRead(true);
        return contactRepository.save(contact);
    }
    
    @Transactional
    public Contact markAsUnread(Long id) {
        Contact contact = contactRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Contact not found"));
        contact.setIsRead(false);
        return contactRepository.save(contact);
    }
    
    public void deleteContact(Long id) {
        contactRepository.deleteById(id);
    }
}
