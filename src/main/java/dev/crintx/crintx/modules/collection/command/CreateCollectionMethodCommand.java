package dev.crintx.crintx.modules.collection.command;

import dev.crintx.crintx.modules.collection.enums.CollectionType;

/**
 * Command inmutable para crear un nuevo método de cobro.
 */
public record CreateCollectionMethodCommand(
    String merchantId,
    String name,
    CollectionType type,
    String accountNumber,
    String alias
) {
    public CreateCollectionMethodCommand {
        if (merchantId == null || merchantId.isBlank()) {
            throw new IllegalArgumentException("El merchantId es obligatorio");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("El nombre del método de cobro es obligatorio");
        }
        if (type == null) {
            throw new IllegalArgumentException("El tipo de cobro es obligatorio");
        }
    }
}
