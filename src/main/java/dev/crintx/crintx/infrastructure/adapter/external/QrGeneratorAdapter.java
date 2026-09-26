package dev.crintx.crintx.infrastructure.adapter.external;

import dev.crintx.crintx.modules.qr.port.out.QrGeneratorPort;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class QrGeneratorAdapter implements QrGeneratorPort {

    @Override
    public GeneratedQr generate(String merchantId, BigDecimal amount, String description, String referenceId) {
        String qrId = "qr_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        String qrCodePayload = String.format("yappy://pay?merchant=%s&amount=%s&ref=%s",
            merchantId,
            amount != null ? amount.toPlainString() : "0",
            referenceId != null ? referenceId : qrId
        );
        String qrImageUrl = String.format("https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=%s", qrCodePayload);

        return new GeneratedQr(
            qrId,
            qrCodePayload,
            qrImageUrl,
            LocalDateTime.now().plusMinutes(15)
        );
    }
}
