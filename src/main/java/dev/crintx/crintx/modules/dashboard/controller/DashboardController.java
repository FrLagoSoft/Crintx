package dev.crintx.crintx.modules.dashboard.controller;

import dev.crintx.crintx.common.dto.ApiResponseDTO;
import dev.crintx.crintx.modules.dashboard.command.GetDashboardSummaryCommand;
import dev.crintx.crintx.modules.dashboard.dto.DashboardSummaryResponseDTO;
import dev.crintx.crintx.modules.dashboard.logic.DashboardLogic;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardLogic dashboardLogic;

    public DashboardController(DashboardLogic dashboardLogic) {
        this.dashboardLogic = dashboardLogic;
    }

    @GetMapping("/summary/{merchantId}")
    public ResponseEntity<ApiResponseDTO<DashboardSummaryResponseDTO>> getSummary(
        @PathVariable String merchantId,
        @RequestParam(required = false, defaultValue = "TODAY") String period
    ) {
        // 1. Mapear a un Command inmutable
        GetDashboardSummaryCommand command = new GetDashboardSummaryCommand(merchantId, period);

        // 2. Invocar la capa de lógica (caso de uso)
        DashboardSummaryResponseDTO responseDTO = dashboardLogic.getSummary(command);

        // 3. Retornar la respuesta estandarizada
        return ResponseEntity.ok(ApiResponseDTO.ok(responseDTO, "Resumen obtenido exitosamente"));
    }
}
