package dev.crintx.crintx.modules.location.dto;

import java.time.LocalDateTime;

public record LocationPointDTO(
    String id,
    String deviceId,
    String userId,
    Double latitude,
    Double longitude,
    Double speed,
    Double accuracy,
    Double altitude,
    Integer batteryLevel,
    String activityType,
    LocalDateTime timestamp,
    LocalDateTime recordedAt
) {}
