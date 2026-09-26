package dev.crintx.crintx.infrastructure.adapter.repository;

import dev.crintx.crintx.modules.collection.enums.CollectionStatus;
import dev.crintx.crintx.modules.collection.enums.CollectionType;
import dev.crintx.crintx.modules.collection.port.out.CollectionMethodRepositoryPort;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class CollectionMethodRepositoryAdapter implements CollectionMethodRepositoryPort {

    private final Map<String, CollectionMethodData> storage = new ConcurrentHashMap<>();

    public CollectionMethodRepositoryAdapter() {
        // Datos de ejemplo pre-cargados
        CollectionMethodData defaultMethod = new CollectionMethodData(
            "cm-001",
            "merchant-default-001",
            "QR Principal Mostrador",
            CollectionType.QR_STATIC,
            "123-456-789",
            "tienda_central",
            CollectionStatus.ACTIVE,
            LocalDateTime.now().minusDays(5)
        );
        storage.put(defaultMethod.id(), defaultMethod);
    }

    @Override
    public CollectionMethodData save(CollectionMethodData data) {
        storage.put(data.id(), data);
        return data;
    }

    @Override
    public List<CollectionMethodData> findByMerchantId(String merchantId) {
        return storage.values().stream()
            .filter(item -> item.merchantId().equals(merchantId))
            .toList();
    }

    @Override
    public Optional<CollectionMethodData> findById(String id) {
        return Optional.ofNullable(storage.get(id));
    }
}
