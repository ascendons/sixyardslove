package com.ascendons.media;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final S3Service s3Service;

    public record PresignRequest(
            @NotBlank String folder,
            @NotBlank String fileName,
            @NotBlank String contentType
    ) {}

    public record PresignResponse(String uploadUrl, String publicUrl) {}

    @PostMapping("/presign")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PresignResponse> presign(@Valid @RequestBody PresignRequest request) {
        S3Service.PresignResult result = s3Service.generatePresignedUploadUrl(
                request.folder(), request.fileName(), request.contentType());
        return ResponseEntity.ok(new PresignResponse(result.uploadUrl(), result.publicUrl()));
    }

    /**
     * Direct server-side upload — browser sends the file here instead of S3.
     * Bypasses CORS restrictions. Used as fallback when the presigned-URL flow fails.
     */
    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

    @PostMapping(value = "/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<PresignResponse> uploadDirect(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "site-media") String folder) {
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.PAYLOAD_TOO_LARGE,
                    "File exceeds maximum allowed size of 10 MB");
        }
        try {
            String publicUrl = s3Service.uploadBytes(
                    folder,
                    file.getOriginalFilename(),
                    file.getContentType(),
                    file.getBytes());
            return ResponseEntity.ok(new PresignResponse(publicUrl, publicUrl));
        } catch (Exception e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "Upload failed: " + e.getMessage());
        }
    }
}
