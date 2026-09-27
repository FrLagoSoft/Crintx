package dev.crintx.crintx.infrastructure.adapter.repository;

import dev.crintx.crintx.infrastructure.document.DeviceLocationDocument;
import dev.crintx.crintx.infrastructure.repository.SpringDataMongoLocationRepository;
import dev.crintx.crintx.modules.location.port.out.LocationRepositoryPort;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Repository
@ConditionalOnProperty(name = "app.storage.type", havingValue = "mongodb")
public class MongoLocationRepositoryAdapter implements LocationRepositoryPort {

    private final SpringDataMongoLocationRepository mongoRepository;

    public MongoLocationRepositoryAdapter(SpringDataMongoLocationRepository mongoRepository) {
        this.mongoRepository = mongoRepository;
    }

    @Override
    public LocationRecordData save(LocationRecordData data) {
        DeviceLocationDocument doc = new DeviceLocationDocument(
            data.id(),
            data.deviceId(),
            data.userId(),
            data.latitude(),
            data.longitude(),
            data.timestamp(),
            data.recordedAt() != null ? data.recordedAt() : Instant.now()
        );

        DeviceLocationDocument saved = mongoRepository.save(doc);
        return mapToRecord(saved);
    }

    @Override
    public List<LocationRecordData> findHistory(String deviceId, Instant from, Instant to, int limit) {
        PageRequest pageRequest = PageRequest.of(0, Math.min(limit, 500));
        List<DeviceLocationDocument> docs;

        if (from != null && to != null) {
            docs = mongoRepository.findHistoryByDeviceIdAndRange(deviceId, from, to, pageRequest);
        } else {
            docs = mongoRepository.findByDeviceIdOrderByTimestampDesc(deviceId, pageRequest);
        }

        return docs.stream().map(this::mapToRecord).toList();
    }

    @Override
    public Optional<LocationRecordData> findLatest(String deviceId) {
        return mongoRepository.findFirstByDeviceIdOrderByTimestampDesc(deviceId)
            .map(this::mapToRecord);
    }

    private LocationRecordData mapToRecord(DeviceLocationDocument doc) {
        return new LocationRecordData(
            doc.getId(),
            doc.getDeviceId(),
            doc.getUserId(),
            doc.getLatitude(),
            doc.getLongitude(),
            doc.getTimestamp(),
            doc.getRecordedAt()
        );
    }
}
