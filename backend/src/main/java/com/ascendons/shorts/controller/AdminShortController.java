package com.ascendons.shorts.controller;

import com.ascendons.shorts.dto.ShortRequest;
import com.ascendons.shorts.dto.ShortResponse;
import com.ascendons.shorts.service.ShortService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/admin/shorts")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
@RequiredArgsConstructor
public class AdminShortController {

    private final ShortService shortService;

    @GetMapping
    public ResponseEntity<List<ShortResponse>> getAll() {
        return ResponseEntity.ok(shortService.getAll());
    }

    @PostMapping
    public ResponseEntity<ShortResponse> create(@Valid @RequestBody ShortRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shortService.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShortResponse> update(@PathVariable UUID id, @Valid @RequestBody ShortRequest req) {
        return ResponseEntity.ok(shortService.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        shortService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
