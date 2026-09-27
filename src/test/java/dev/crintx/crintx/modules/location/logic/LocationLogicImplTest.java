package dev.crintx.crintx.modules.location.logic;

import dev.crintx.crintx.common.exception.ApiException;
import dev.crintx.crintx.common.exception.ResponseCode;
import dev.crintx.crintx.modules.location.command.GetLocationHistoryCommand;
import dev.crintx.crintx.modules.location.command.TrackLocationCommand;
import dev.crintx.crintx.modules.location.dto.LocationHistoryResponseDTO;
import dev.crintx.crintx.modules.location.dto.LocationPointDTO;
import dev.crintx.crintx.modules.location.logic.impl.LocationLogicImpl;
import dev.crintx.crintx.modules.location.mapper.LocationMapper;
import dev.crintx.crintx.modules.location.port.out.LocationRepositoryPort;
import dev.crintx.crintx.modules.location.port.out.LocationRepositoryPort.LocationRecordData;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LocationLogicImplTest {

    @Mock
    private LocationRepositoryPort repositoryPort;

    @Mock
    private LocationMapper mapper;

    @InjectMocks
    private LocationLogicImpl locationLogic;

    private static final String DEVICE_ID = "device-123";
    private static final String USER_ID = "user-456";
    private static final Instant NOW = Instant.parse("2026-09-26T15:00:00Z");

    private LocationRecordData sampleData() {
        return new LocationRecordData(
            "id-1", DEVICE_ID, USER_ID,
            8.98238, -79.51973,
            NOW, NOW.plusSeconds(1)
        );
    }

    private LocationPointDTO samplePointDTO() {
        return new LocationPointDTO(
            "id-1", DEVICE_ID, USER_ID,
            8.98238, -79.51973,
            NOW, NOW.plusSeconds(1)
        );
    }

    @Nested
    @DisplayName("trackLocation()")
    class TrackLocationLogicTests {

        @Test
        @DisplayName("✅ Mapea command, guarda en repositorio y mapea respuesta")
        void trackLocation_success() {
            TrackLocationCommand command = new TrackLocationCommand(
                DEVICE_ID, USER_ID, 8.98238, -79.51973, NOW
            );
            LocationRecordData data = sampleData();
            LocationPointDTO expectedDTO = samplePointDTO();

            when(mapper.toRecordData(command)).thenReturn(data);
            when(repositoryPort.save(data)).thenReturn(data);
            when(mapper.toPointDTO(data)).thenReturn(expectedDTO);

            LocationPointDTO result = locationLogic.trackLocation(command);

            assertNotNull(result);
            assertEquals(DEVICE_ID, result.deviceId());
            assertEquals(USER_ID, result.userId());
            assertEquals(8.98238, result.latitude());

            verify(mapper).toRecordData(command);
            verify(repositoryPort).save(data);
            verify(mapper).toPointDTO(data);
        }
    }

    @Nested
    @DisplayName("getLocationHistory()")
    class GetLocationHistoryLogicTests {

        @Test
        @DisplayName("✅ Obtiene lista de registros del repositorio y delega mapeo")
        void getLocationHistory_success() {
            Instant from = NOW.minus(1, ChronoUnit.DAYS);
            GetLocationHistoryCommand command = new GetLocationHistoryCommand(
                DEVICE_ID, from, NOW, 50
            );
            List<LocationRecordData> records = List.of(sampleData());
            LocationHistoryResponseDTO expectedHistory = new LocationHistoryResponseDTO(
                DEVICE_ID, 1, List.of(samplePointDTO())
            );

            when(repositoryPort.findHistory(DEVICE_ID, from, NOW, 50))
                .thenReturn(records);
            when(mapper.toHistoryDTO(DEVICE_ID, records))
                .thenReturn(expectedHistory);

            LocationHistoryResponseDTO result = locationLogic.getLocationHistory(command);

            assertNotNull(result);
            assertEquals(DEVICE_ID, result.deviceId());
            assertEquals(1, result.count());

            verify(repositoryPort).findHistory(DEVICE_ID, from, NOW, 50);
            verify(mapper).toHistoryDTO(DEVICE_ID, records);
        }
    }

    @Nested
    @DisplayName("getLatestLocation()")
    class GetLatestLocationLogicTests {

        @Test
        @DisplayName("✅ Retorna punto si existe en repositorio")
        void getLatestLocation_found() {
            LocationRecordData data = sampleData();
            LocationPointDTO expectedDTO = samplePointDTO();

            when(repositoryPort.findLatest(DEVICE_ID)).thenReturn(Optional.of(data));
            when(mapper.toPointDTO(data)).thenReturn(expectedDTO);

            LocationPointDTO result = locationLogic.getLatestLocation(DEVICE_ID);

            assertNotNull(result);
            assertEquals(DEVICE_ID, result.deviceId());
            verify(repositoryPort).findLatest(DEVICE_ID);
        }

        @Test
        @DisplayName("❌ Lanza ApiException 404 si el dispositivo no tiene registros")
        void getLatestLocation_notFound_throwsApiException() {
            when(repositoryPort.findLatest("unknown-dev")).thenReturn(Optional.empty());

            ApiException ex = assertThrows(
                ApiException.class,
                () -> locationLogic.getLatestLocation("unknown-dev")
            );

            assertEquals(ResponseCode.RESOURCE_NOT_FOUND, ex.getResponseCode());
            assertEquals(HttpStatus.NOT_FOUND, ex.getHttpStatus());
            assertTrue(ex.getMessage().contains("unknown-dev"));
        }
    }
}
