package dev.crintx.crintx.modules.location.command;

import java.time.Instant;

/**
 * Command inmutable para registrar una nueva coordenada de ubicación de un dispositivo.
 */
public record TrackLocationCommand(
    String deviceId,
    String userId,
    Double latitude,
    Double longitude,
    Instant timestamp
) {
    public TrackLocationCommand {
        if (deviceId == null || deviceId.isBlank()) {
            throw new IllegalArgumentException("El deviceId es obligatorio");
        }
        if (latitude == null || latitude < -90.0 || latitude > 90.0) {
            throw new IllegalArgumentException("La latitud debe estar entre -90 y 90 grados");
        }
        if (longitude == null || longitude < -180.0 || longitude > 180.0) {
            throw new IllegalArgumentException("La longitud debe estar entre -180 y 180 grados");
        }
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }
}
