package dev.crintx.crintx.modules.dashboard.port.out;

import java.math.BigDecimal;
import java.util.List;

public interface ExternalAnalyticsServicePort {
    List<ExternalActivity> fetchRecentActivities(String merchantId);

    record ExternalActivity(
        String id,
        String description,
        BigDecimal amount,
        String status,
        String timestamp
    ) {}
}
