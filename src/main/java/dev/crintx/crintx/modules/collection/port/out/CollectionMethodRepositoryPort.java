package dev.crintx.crintx.modules.collection.port.out;

import dev.crintx.crintx.modules.collection.enums.CollectionStatus;
import dev.crintx.crintx.modules.collection.enums.CollectionType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CollectionMethodRepositoryPort {
    CollectionMethodData save(CollectionMethodData data);
    List<CollectionMethodData> findByMerchantId(String merchantId);
    Optional<CollectionMethodData> findById(String id);

    record CollectionMethodData(
        String id,
        String merchantId,
        String name,
        CollectionType type,
        String accountNumber,
        String alias,
        CollectionStatus status,
        LocalDateTime createdAt
    ) {}
}
