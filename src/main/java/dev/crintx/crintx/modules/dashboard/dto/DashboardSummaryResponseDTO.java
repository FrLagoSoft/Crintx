package dev.crintx.crintx.modules.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummaryResponseDTO(
    String merchantId,
    String period,
    BigDecimal totalSales,
    long totalTransactions,
    BigDecimal averageTicket,
    String currency,
    List<DashboardRecentActivityDTO> recentActivities
) {
    public record DashboardRecentActivityDTO(
        String id,
        String description,
        BigDecimal amount,
        String status,
        String createdAt
    ) {}
}
