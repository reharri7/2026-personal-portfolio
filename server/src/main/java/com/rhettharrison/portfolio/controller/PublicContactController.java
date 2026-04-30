package com.rhettharrison.portfolio.controller;

import com.rhettharrison.portfolio.model.Contact;
import com.rhettharrison.portfolio.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/contact")
@RequiredArgsConstructor
public class PublicContactController {

    private final ContactService contactService;

    @PostMapping
    public ResponseEntity<Contact> createContact(@Valid @RequestBody Contact contact) {
        Contact saved = contactService.createContact(contact);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
