package dev.crintx.crintx.modules.dashboard.port.out;

import java.math.BigDecimal;
import java.util.Optional;

public interface DashboardRepositoryPort {
    Optional<DashboardData> findSummaryByMerchantAndPeriod(String merchantId, String period);

    record DashboardData(
        String merchantId,
        String period,
        BigDecimal totalSales,
        long totalTransactions
    ) {}
}
