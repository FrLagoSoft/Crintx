package dev.crintx.crintx.modules.qr.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record QrResponseDTO(
    String qrId,
    String qrCodeData,
    String qrImageUrl,
    BigDecimal amount,
    String currency,
    String referenceId,
    LocalDateTime expiresAt
) {}
