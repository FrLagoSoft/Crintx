package dev.crintx.crintx.infrastructure.adapter.external;

import dev.crintx.crintx.modules.dashboard.port.out.ExternalAnalyticsServicePort;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class ExternalAnalyticsServiceAdapter implements ExternalAnalyticsServicePort {

    @Override
    public List<ExternalActivity> fetchRecentActivities(String merchantId) {
        String now = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        return List.of(
            new ExternalActivity("act-101", "Cobro vía QR Yappy", new BigDecimal("45.00"), "COMPLETED", now),
            new ExternalActivity("act-102", "Transferencia Directa", new BigDecimal("120.00"), "COMPLETED", now),
            new ExternalActivity("act-103", "Cobro con Tarjeta", new BigDecimal("15.50"), "COMPLETED", now)
        );
    }
}
