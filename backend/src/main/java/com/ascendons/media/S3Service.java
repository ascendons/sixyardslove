package com.ascendons.media;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.time.Duration;
import java.util.UUID;

@Service
public class S3Service {

    private final S3Presigner presigner;
    private final StaticCredentialsProvider credentialsProvider;
    private final String bucket;
    private final String region;
    private final long presignExpiryMinutes;

    public S3Service(
            @Value("${app.aws.access-key-id}") String accessKeyId,
            @Value("${app.aws.secret-access-key}") String secretAccessKey,
            @Value("${app.aws.region:ap-south-1}") String region,
            @Value("${app.aws.s3.media-bucket:syl-media}") String bucket,
            @Value("${app.aws.s3.presign-expiry-minutes:10}") long presignExpiryMinutes) {
        this.region = region;
        this.bucket = bucket;
        this.presignExpiryMinutes = presignExpiryMinutes;
        this.credentialsProvider = StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKeyId, secretAccessKey));
        this.presigner = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(this.credentialsProvider)
                .build();
    }

    /**
     * Generates a presigned PUT URL and returns both the upload URL and the final public URL.
     */
    public PresignResult generatePresignedUploadUrl(String folder, String originalFileName, String contentType) {
        String sanitized = originalFileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String key = folder + "/" + UUID.randomUUID() + "-" + sanitized;

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .build();

        PresignedPutObjectRequest presigned = presigner.presignPutObject(r -> r
                .signatureDuration(Duration.ofMinutes(presignExpiryMinutes))
                .putObjectRequest(putRequest));

        String publicUrl = "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;

        return new PresignResult(presigned.url().toString(), publicUrl);
    }

    /**
     * Uploads a file directly from server-side bytes — bypasses browser CORS.
     * Used as fallback when the presigned-S3 PUT fails from the browser.
     */
    public String uploadBytes(String folder, String originalFileName, String contentType, byte[] bytes) {
        String sanitized = originalFileName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String key = folder + "/" + UUID.randomUUID() + "-" + sanitized;

        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .build();

        software.amazon.awssdk.services.s3.S3Client s3 = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider)
                .build();

        s3.putObject(putRequest, software.amazon.awssdk.core.sync.RequestBody.fromBytes(bytes));

        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
    }

    public record PresignResult(String uploadUrl, String publicUrl) {}
}
