package dev.crintx.crintx.modules.location.dto;

import java.time.Instant;

public record LocationPointDTO(
    String id,
    String deviceId,
    String userId,
    Double latitude,
    Double longitude,
    Instant timestamp,
    Instant recordedAt
) {}
