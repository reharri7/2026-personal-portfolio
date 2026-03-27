package com.rhettharrison.portfolio.controller;

import com.rhettharrison.portfolio.model.Contact;
import com.rhettharrison.portfolio.service.ContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class ContactController {
    
    private final ContactService contactService;
    
    @PostMapping
    public ResponseEntity<Contact> createContact(@RequestBody Contact contact) {
        Contact savedContact = contactService.createContact(contact);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedContact);
    }
    
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<Contact>> getAllContacts() {
        return ResponseEntity.ok(contactService.getAllContacts());
    }
    
    @GetMapping("/unread")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<Contact>> getUnreadContacts() {
        return ResponseEntity.ok(contactService.getUnreadContacts());
    }
    
    @GetMapping("/read")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<Contact>> getReadContacts() {
        return ResponseEntity.ok(contactService.getReadContacts());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Contact> getContactById(@PathVariable Long id) {
        return contactService.getContactById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/{id}/read")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Contact> markAsRead(@PathVariable Long id) {
        try {
            Contact contact = contactService.markAsRead(id);
            return ResponseEntity.ok(contact);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PatchMapping("/{id}/unread")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Contact> markAsUnread(@PathVariable Long id) {
        try {
            Contact contact = contactService.markAsUnread(id);
            return ResponseEntity.ok(contact);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteContact(@PathVariable Long id) {
        contactService.deleteContact(id);
        return ResponseEntity.noContent().build();
    }
}
