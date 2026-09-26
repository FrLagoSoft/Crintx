package dev.crintx.crintx.modules.collection.dto;

import dev.crintx.crintx.modules.collection.enums.CollectionStatus;
import dev.crintx.crintx.modules.collection.enums.CollectionType;

import java.time.LocalDateTime;

public record CollectionMethodResponseDTO(
    String id,
    String merchantId,
    String name,
    CollectionType type,
    String accountNumber,
    String alias,
    CollectionStatus status,
    LocalDateTime createdAt
) {}
