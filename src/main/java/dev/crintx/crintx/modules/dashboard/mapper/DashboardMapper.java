package dev.crintx.crintx.modules.dashboard.mapper;

import dev.crintx.crintx.modules.dashboard.dto.DashboardSummaryResponseDTO;
import dev.crintx.crintx.modules.dashboard.port.out.DashboardRepositoryPort.DashboardData;
import dev.crintx.crintx.modules.dashboard.port.out.ExternalAnalyticsServicePort.ExternalActivity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Component
public class DashboardMapper {

    public DashboardSummaryResponseDTO toResponseDTO(DashboardData data, List<ExternalActivity> activities) {
        BigDecimal averageTicket = BigDecimal.ZERO;
        if (data.totalTransactions() > 0) {
            averageTicket = data.totalSales().divide(BigDecimal.valueOf(data.totalTransactions()), 2, RoundingMode.HALF_UP);
        }

        List<DashboardSummaryResponseDTO.DashboardRecentActivityDTO> activityDTOs = activities.stream()
            .map(a -> new DashboardSummaryResponseDTO.DashboardRecentActivityDTO(
                a.id(),
                a.description(),
                a.amount(),
                a.status(),
                a.timestamp()
            ))
            .toList();

        return new DashboardSummaryResponseDTO(
            data.merchantId(),
            data.period(),
            data.totalSales(),
            data.totalTransactions(),
            averageTicket,
            "USD",
            activityDTOs
        );
    }
}
