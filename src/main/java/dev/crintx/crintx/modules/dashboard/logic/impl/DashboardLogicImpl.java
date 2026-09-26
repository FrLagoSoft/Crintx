package dev.crintx.crintx.modules.dashboard.logic.impl;

import dev.crintx.crintx.modules.dashboard.command.GetDashboardSummaryCommand;
import dev.crintx.crintx.modules.dashboard.dto.DashboardSummaryResponseDTO;
import dev.crintx.crintx.modules.dashboard.logic.DashboardLogic;
import dev.crintx.crintx.modules.dashboard.mapper.DashboardMapper;
import dev.crintx.crintx.modules.dashboard.port.out.DashboardRepositoryPort;
import dev.crintx.crintx.modules.dashboard.port.out.DashboardRepositoryPort.DashboardData;
import dev.crintx.crintx.modules.dashboard.port.out.ExternalAnalyticsServicePort;
import dev.crintx.crintx.modules.dashboard.port.out.ExternalAnalyticsServicePort.ExternalActivity;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class DashboardLogicImpl implements DashboardLogic {

    private final DashboardRepositoryPort dashboardRepositoryPort;
    private final ExternalAnalyticsServicePort externalAnalyticsServicePort;
    private final DashboardMapper dashboardMapper;

    public DashboardLogicImpl(
        DashboardRepositoryPort dashboardRepositoryPort,
        ExternalAnalyticsServicePort externalAnalyticsServicePort,
        DashboardMapper dashboardMapper
    ) {
        this.dashboardRepositoryPort = dashboardRepositoryPort;
        this.externalAnalyticsServicePort = externalAnalyticsServicePort;
        this.dashboardMapper = dashboardMapper;
    }

    @Override
    public DashboardSummaryResponseDTO getSummary(GetDashboardSummaryCommand command) {
        DashboardData data = dashboardRepositoryPort
            .findSummaryByMerchantAndPeriod(command.merchantId(), command.period())
            .orElseGet(() -> new DashboardData(command.merchantId(), command.period(), BigDecimal.ZERO, 0));

        List<ExternalActivity> activities = externalAnalyticsServicePort
            .fetchRecentActivities(command.merchantId());

        return dashboardMapper.toResponseDTO(data, activities);
    }
}
