package com.ascendons.media.asset;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class MediaAssetController {

    private final MediaAssetService service;

    // ── Public endpoints ────────────────────────────────────────────────────

    /** Get all assets for a specific placement (e.g. HOME_HERO, HOME_CAROUSEL) */
    @GetMapping("/api/media-assets")
    public ResponseEntity<List<MediaAssetResponse>> getByPlacement(
            @RequestParam String placement) {
        return ResponseEntity.ok(service.getByPlacement(placement));
    }

    /** Get all assets of a type (BANNER or CAROUSEL) — useful for admin overview */
    @GetMapping("/api/media-assets/type/{type}")
    public ResponseEntity<List<MediaAssetResponse>> getByType(@PathVariable String type) {
        return ResponseEntity.ok(service.getByType(type));
    }

    // ── Admin endpoints ─────────────────────────────────────────────────────

    @PostMapping("/api/admin/media-assets")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<MediaAssetResponse> create(@Valid @RequestBody MediaAssetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/api/admin/media-assets/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<MediaAssetResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody MediaAssetRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/api/admin/media-assets/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
