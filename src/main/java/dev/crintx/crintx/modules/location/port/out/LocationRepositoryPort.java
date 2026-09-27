package dev.crintx.crintx.modules.location.port.out;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface LocationRepositoryPort {

    LocationRecordData save(LocationRecordData data);

    List<LocationRecordData> findHistory(String deviceId, Instant from, Instant to, int limit);

    Optional<LocationRecordData> findLatest(String deviceId);

    record LocationRecordData(
        String id,
        String deviceId,
        String userId,
        Double latitude,
        Double longitude,
        Instant timestamp,
        Instant recordedAt
    ) {}
}
