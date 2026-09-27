package dev.crintx.crintx.infrastructure.adapter.repository;

import dev.crintx.crintx.modules.location.port.out.LocationRepositoryPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
@ConditionalOnProperty(name = "app.storage.type", havingValue = "in-memory", matchIfMissing = true)
public class InMemoryLocationRepositoryAdapter implements LocationRepositoryPort {

    private final Map<String, List<LocationRecordData>> storage = new ConcurrentHashMap<>();

    @Override
    public LocationRecordData save(LocationRecordData data) {
        LocationRecordData recordToSave = new LocationRecordData(
            data.id() != null ? data.id() : java.util.UUID.randomUUID().toString(),
            data.deviceId(),
            data.userId(),
            data.latitude(),
            data.longitude(),
            data.timestamp(),
            data.recordedAt() != null ? data.recordedAt() : Instant.now()
        );

        storage.computeIfAbsent(data.deviceId(), k -> new ArrayList<>()).add(0, recordToSave);
        return recordToSave;
    }

    @Override
    public List<LocationRecordData> findHistory(String deviceId, Instant from, Instant to, int limit) {
        List<LocationRecordData> records = storage.getOrDefault(deviceId, List.of());
        return records.stream()
            .filter(r -> (from == null || !r.timestamp().isBefore(from)))
            .filter(r -> (to == null || !r.timestamp().isAfter(to)))
            .limit(limit > 0 ? limit : 50)
            .toList();
    }

    @Override
    public Optional<LocationRecordData> findLatest(String deviceId) {
        List<LocationRecordData> records = storage.getOrDefault(deviceId, List.of());
        return records.isEmpty() ? Optional.empty() : Optional.of(records.get(0));
    }
}
