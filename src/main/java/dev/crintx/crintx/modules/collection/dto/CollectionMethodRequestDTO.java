package dev.crintx.crintx.modules.collection.dto;

import dev.crintx.crintx.modules.collection.enums.CollectionType;

public record CollectionMethodRequestDTO(
    String name,
    CollectionType type,
    String accountNumber,
    String alias
) {}
