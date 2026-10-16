package com.ascendons.contact.controller;

import com.ascendons.contact.dto.ContactMessageDto;
import com.ascendons.contact.dto.CreateContactMessageRequest;
import com.ascendons.contact.service.ContactMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactMessageController {

    private final ContactMessageService service;

    @PostMapping
    public ResponseEntity<ContactMessageDto> createMessage(@Valid @RequestBody CreateContactMessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createMessage(request));
    }
}
