package dev.crintx.crintx.modules.dashboard.command;

/**
 * Command inmutable que representa la acción y parámetros de entrada
 * para obtener el resumen del Dashboard.
 */
public record GetDashboardSummaryCommand(
    String merchantId,
    String period
) {
    public GetDashboardSummaryCommand {
        if (merchantId == null || merchantId.isBlank()) {
            throw new IllegalArgumentException("El merchantId no puede estar vacío");
        }
        if (period == null || period.isBlank()) {
            period = "TODAY";
        }
    }
}
