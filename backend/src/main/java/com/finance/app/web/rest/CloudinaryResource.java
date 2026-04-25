package com.finance.app.web.rest;

import com.finance.app.web.rest.errors.BadRequestAlertException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cloudinary")
public class CloudinaryResource {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @PostMapping("/signature")
    public ResponseEntity<Map<String, Object>> createUploadSignature() {
        if (isBlank(cloudName) || isBlank(apiKey) || isBlank(apiSecret)) {
            throw new BadRequestAlertException(
                "Cloudinary credentials are missing",
                "cloudinary",
                "configmissing"
            );
        }

        long timestamp = Instant.now().getEpochSecond();
        String stringToSign = "timestamp=" + timestamp;
        String signature = sha1Hex(stringToSign + apiSecret);

        Map<String, Object> payload = new HashMap<>();
        payload.put("cloudName", cloudName);
        payload.put("apiKey", apiKey);
        payload.put("timestamp", timestamp);
        payload.put("signature", signature);
        return ResponseEntity.ok(payload);
    }

    private static boolean isBlank(String v) {
        return v == null || v.trim().isEmpty();
    }

    private static String sha1Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-1 algorithm is unavailable", e);
        }
    }
}
