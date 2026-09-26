package dev.crintx.crintx.infrastructure.repository;

import dev.crintx.crintx.infrastructure.document.DeviceLocationDocument;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SpringDataMongoLocationRepository extends MongoRepository<DeviceLocationDocument, String> {

    List<DeviceLocationDocument> findByDeviceIdOrderByTimestampDesc(String deviceId, Pageable pageable);

    @Query("{ 'deviceId': ?0, 'timestamp': { $gte: ?1, $lte: ?2 } }")
    List<DeviceLocationDocument> findHistoryByDeviceIdAndRange(
        String deviceId,
        LocalDateTime from,
        LocalDateTime to,
        Pageable pageable
    );

    Optional<DeviceLocationDocument> findFirstByDeviceIdOrderByTimestampDesc(String deviceId);
}
