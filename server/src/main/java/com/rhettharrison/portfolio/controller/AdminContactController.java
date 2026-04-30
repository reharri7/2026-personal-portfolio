package com.rhettharrison.portfolio.controller;

import com.rhettharrison.portfolio.model.Contact;
import com.rhettharrison.portfolio.service.ContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/contact")
@RequiredArgsConstructor
public class AdminContactController {

    private final ContactService contactService;

    @GetMapping
    public ResponseEntity<List<Contact>> getAllContacts() {
        return ResponseEntity.ok(contactService.getAllContacts());
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Contact>> getUnreadContacts() {
        return ResponseEntity.ok(contactService.getUnreadContacts());
    }

    @GetMapping("/read")
    public ResponseEntity<List<Contact>> getReadContacts() {
        return ResponseEntity.ok(contactService.getReadContacts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Contact> getContactById(@PathVariable Long id) {
        return contactService.getContactById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Contact> markAsRead(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(contactService.markAsRead(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/unread")
    public ResponseEntity<Contact> markAsUnread(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(contactService.markAsUnread(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContact(@PathVariable Long id) {
        if (contactService.getContactById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        contactService.deleteContact(id);
        return ResponseEntity.noContent().build();
    }
}
