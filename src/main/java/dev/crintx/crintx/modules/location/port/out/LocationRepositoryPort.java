package dev.crintx.crintx.modules.location.port.out;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LocationRepositoryPort {

    LocationRecordData save(LocationRecordData data);

    List<LocationRecordData> findHistory(String deviceId, LocalDateTime from, LocalDateTime to, int limit);

    Optional<LocationRecordData> findLatest(String deviceId);

    record LocationRecordData(
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
}
