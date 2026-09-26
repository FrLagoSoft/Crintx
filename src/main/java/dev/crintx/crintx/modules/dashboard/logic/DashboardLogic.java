package dev.crintx.crintx.modules.dashboard.logic;

import dev.crintx.crintx.modules.dashboard.command.GetDashboardSummaryCommand;
import dev.crintx.crintx.modules.dashboard.dto.DashboardSummaryResponseDTO;

public interface DashboardLogic {
    DashboardSummaryResponseDTO getSummary(GetDashboardSummaryCommand command);
}
