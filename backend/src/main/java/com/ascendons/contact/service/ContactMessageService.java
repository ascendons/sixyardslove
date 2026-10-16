package com.ascendons.contact.service;

import com.ascendons.contact.dto.ContactMessageDto;
import com.ascendons.contact.dto.CreateContactMessageRequest;
import com.ascendons.contact.entity.ContactMessage;
import com.ascendons.contact.repository.ContactMessageRepository;
import com.ascendons.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ContactMessageService {

    private final ContactMessageRepository repository;

    @Transactional
    public ContactMessageDto createMessage(CreateContactMessageRequest request) {
        ContactMessage message = ContactMessage.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .subject(request.getSubject())
                .message(request.getMessage())
                .isRead(false)
                .build();
        
        ContactMessage saved = repository.save(message);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ContactMessageDto> getAllMessages() {
        return repository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(UUID id) {
        ContactMessage message = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        message.setIsRead(true);
        repository.save(message);
    }

    @Transactional
    public void deleteMessage(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Message not found");
        }
        repository.deleteById(id);
    }

    private ContactMessageDto mapToDto(ContactMessage entity) {
        return ContactMessageDto.builder()
                .id(entity.getId())
                .name(entity.getName())
                .email(entity.getEmail())
                .phone(entity.getPhone())
                .subject(entity.getSubject())
                .message(entity.getMessage())
                .isRead(entity.getIsRead())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
