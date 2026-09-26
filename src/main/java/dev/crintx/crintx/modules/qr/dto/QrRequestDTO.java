package dev.crintx.crintx.modules.qr.dto;

import java.math.BigDecimal;

public record QrRequestDTO(
    BigDecimal amount,
    String description,
    String referenceId
) {}
