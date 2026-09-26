package dev.crintx.crintx.modules.qr.port.out;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface QrGeneratorPort {
    GeneratedQr generate(String merchantId, BigDecimal amount, String description, String referenceId);

    record GeneratedQr(
        String qrId,
        String qrCodeData,
        String qrImageUrl,
        LocalDateTime expiresAt
    ) {}
}
