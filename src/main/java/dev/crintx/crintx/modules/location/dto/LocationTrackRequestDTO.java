package dev.crintx.crintx.modules.location.dto;

import java.time.Instant;

public record LocationTrackRequestDTO(
    String userId,
    Double latitude,
    Double longitude,
    Instant timestamp
) {}
