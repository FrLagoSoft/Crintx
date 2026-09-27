package dev.crintx.crintx.modules.location.command;

import java.time.Instant;

public record GetLocationHistoryCommand(
    String deviceId,
    Instant from,
    Instant to,
    int limit
) {
    public GetLocationHistoryCommand {
        if (deviceId == null || deviceId.isBlank()) {
            throw new IllegalArgumentException("El deviceId es obligatorio");
        }
        if (limit <= 0) {
            limit = 50;
        }
    }
}
