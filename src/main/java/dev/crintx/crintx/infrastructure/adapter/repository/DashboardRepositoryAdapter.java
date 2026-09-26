package dev.crintx.crintx.infrastructure.adapter.repository;

import dev.crintx.crintx.modules.dashboard.port.out.DashboardRepositoryPort;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public class DashboardRepositoryAdapter implements DashboardRepositoryPort {

    @Override
    public Optional<DashboardData> findSummaryByMerchantAndPeriod(String merchantId, String period) {
        // En una implementación con base de datos real (JPA/Hibernate), aquí se consultaría la BD.
        // Simulamos la respuesta de la base de datos:
        return Optional.of(new DashboardData(
            merchantId,
            period,
            new BigDecimal("14580.50"),
            184
        ));
    }
}
