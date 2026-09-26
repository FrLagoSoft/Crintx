package dev.crintx.crintx.modules.qr.command;

import java.math.BigDecimal;

public record GenerateQrCommand(
    String merchantId,
    BigDecimal amount,
    String description,
    String referenceId
) {
    public GenerateQrCommand {
        if (merchantId == null || merchantId.isBlank()) {
            throw new IllegalArgumentException("El merchantId es obligatorio");
        }
    }
}
