package dev.crintx.crintx.modules.location.dto;

import java.util.List;

public record LocationHistoryResponseDTO(
    String deviceId,
    int count,
    List<LocationPointDTO> locations
) {}
