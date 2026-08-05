package com.finance.app.web.rest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finance.app.web.rest.errors.BadRequestAlertException;
import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/cloudinary")
public class CloudinaryResource {

  private static final long MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

  @Value("${cloudinary.cloud-name:}")
  private String cloudName;

  @Value("${cloudinary.api-key:}")
  private String apiKey;

  @Value("${cloudinary.api-secret:}")
  private String apiSecret;

  private final ObjectMapper objectMapper;

  public CloudinaryResource(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  @PostMapping("/signature")
  public ResponseEntity<Map<String, Object>> createUploadSignature() {
    ensureConfigured();
    long timestamp = Instant.now().getEpochSecond();
    return ResponseEntity.ok(buildSignaturePayload(timestamp));
  }

  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Map<String, Object>> upload(
    @RequestParam("file") MultipartFile file,
    @RequestParam(value = "resourceType", defaultValue = "image") String resourceType
  ) throws IOException {
    ensureConfigured();
    if (file == null || file.isEmpty()) {
      throw new BadRequestAlertException("File is required", "cloudinary", "filerequired");
    }
    if (file.getSize() > MAX_UPLOAD_BYTES) {
      throw new BadRequestAlertException("File must be under 2 MB", "cloudinary", "filetoolarge");
    }

    String normalizedType = normalizeResourceType(resourceType);
    long timestamp = Instant.now().getEpochSecond();
    String signature = signTimestamp(timestamp);

    MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
    body.add(
      "file",
      new ByteArrayResource(file.getBytes()) {
        @Override
        public String getFilename() {
          String name = file.getOriginalFilename();
          return name != null && !name.isBlank() ? name : "upload";
        }
      }
    );
    body.add("api_key", apiKey);
    body.add("timestamp", String.valueOf(timestamp));
    body.add("signature", signature);

    String uploadUrl =
      "https://api.cloudinary.com/v1_1/" + cloudName + "/" + normalizedType + "/upload";
    String cloudinaryResponse = RestClient.create()
      .post()
      .uri(URI.create(uploadUrl))
      .body(body)
      .retrieve()
      .body(String.class);

    JsonNode data = objectMapper.readTree(cloudinaryResponse != null ? cloudinaryResponse : "{}");
    JsonNode secureUrl = data.get("secure_url");
    if (secureUrl == null || secureUrl.asText().isBlank()) {
      String message = data.path("error").path("message").asText("Image upload failed");
      throw new BadRequestAlertException(message, "cloudinary", "uploadfailed");
    }

    Map<String, Object> payload = new HashMap<>();
    payload.put("secureUrl", secureUrl.asText());
    payload.put(
      "originalFilename",
      file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload"
    );
    return ResponseEntity.ok(payload);
  }

  private void ensureConfigured() {
    if (isBlank(cloudName) || isBlank(apiKey) || isBlank(apiSecret)) {
      throw new BadRequestAlertException(
        "Cloudinary credentials are missing",
        "cloudinary",
        "configmissing"
      );
    }
  }

  private Map<String, Object> buildSignaturePayload(long timestamp) {
    Map<String, Object> payload = new HashMap<>();
    payload.put("cloudName", cloudName);
    payload.put("apiKey", apiKey);
    payload.put("timestamp", timestamp);
    payload.put("signature", signTimestamp(timestamp));
    return payload;
  }

  private String signTimestamp(long timestamp) {
    return sha1Hex("timestamp=" + timestamp + apiSecret);
  }

  private static String normalizeResourceType(String resourceType) {
    String normalized = resourceType == null ? "image" : resourceType.trim().toLowerCase();
    if ("raw".equals(normalized) || "auto".equals(normalized)) return normalized;
    return "image";
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
