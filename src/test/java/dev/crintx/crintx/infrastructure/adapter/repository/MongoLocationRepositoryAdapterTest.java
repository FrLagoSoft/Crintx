package dev.crintx.crintx.infrastructure.adapter.repository;

import dev.crintx.crintx.infrastructure.document.DeviceLocationDocument;
import dev.crintx.crintx.infrastructure.repository.SpringDataMongoLocationRepository;
import dev.crintx.crintx.modules.location.port.out.LocationRepositoryPort.LocationRecordData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MongoLocationRepositoryAdapterTest {

    @Mock
    private SpringDataMongoLocationRepository mongoRepository;

    @InjectMocks
    private MongoLocationRepositoryAdapter repositoryAdapter;

    private static final String DEVICE_ID = "device-abc";
    private static final String USER_ID = "user-xyz";
    private static final Instant NOW = Instant.parse("2026-09-26T16:00:00Z");

    private DeviceLocationDocument sampleDocument() {
        return new DeviceLocationDocument(
            "doc-1", DEVICE_ID, USER_ID,
            8.98238, -79.51973,
            NOW, NOW.plusSeconds(1)
        );
    }

    private LocationRecordData sampleRecordData() {
        return new LocationRecordData(
            "doc-1", DEVICE_ID, USER_ID,
            8.98238, -79.51973,
            NOW, NOW.plusSeconds(1)
        );
    }

    @Nested
    @DisplayName("save()")
    class SaveTests {

        @Test
        @DisplayName("✅ Guarda documento en MongoRepository y retorna RecordData equivalente")
        void save_convertsAndSaves() {
            LocationRecordData inputData = sampleRecordData();
            DeviceLocationDocument savedDoc = sampleDocument();

            when(mongoRepository.save(any(DeviceLocationDocument.class))).thenReturn(savedDoc);

            LocationRecordData result = repositoryAdapter.save(inputData);

            assertNotNull(result);
            assertEquals("doc-1", result.id());
            assertEquals(DEVICE_ID, result.deviceId());
            assertEquals(USER_ID, result.userId());
            assertEquals(8.98238, result.latitude());
            assertEquals(-79.51973, result.longitude());

            ArgumentCaptor<DeviceLocationDocument> captor = ArgumentCaptor.forClass(DeviceLocationDocument.class);
            verify(mongoRepository).save(captor.capture());
            DeviceLocationDocument captured = captor.getValue();
            assertEquals(DEVICE_ID, captured.getDeviceId());
            assertEquals(USER_ID, captured.getUserId());
        }
    }

    @Nested
    @DisplayName("findHistory()")
    class FindHistoryTests {

        @Test
        @DisplayName("✅ Consulta por rango de fechas cuando 'from' y 'to' están presentes")
        void findHistory_withDateRange() {
            Instant from = NOW.minus(1, ChronoUnit.DAYS);
            Instant to = NOW;
            DeviceLocationDocument doc = sampleDocument();

            when(mongoRepository.findHistoryByDeviceIdAndRange(eq(DEVICE_ID), eq(from), eq(to), any(PageRequest.class)))
                .thenReturn(List.of(doc));

            List<LocationRecordData> results = repositoryAdapter.findHistory(DEVICE_ID, from, to, 20);

            assertEquals(1, results.size());
            assertEquals(DEVICE_ID, results.get(0).deviceId());
            verify(mongoRepository).findHistoryByDeviceIdAndRange(eq(DEVICE_ID), eq(from), eq(to), any(PageRequest.class));
            verify(mongoRepository, never()).findByDeviceIdOrderByTimestampDesc(anyString(), any());
        }

        @Test
        @DisplayName("✅ Consulta ordenado por fecha descendente cuando no se da rango")
        void findHistory_withoutDateRange() {
            DeviceLocationDocument doc = sampleDocument();

            when(mongoRepository.findByDeviceIdOrderByTimestampDesc(eq(DEVICE_ID), any(PageRequest.class)))
                .thenReturn(List.of(doc));

            List<LocationRecordData> results = repositoryAdapter.findHistory(DEVICE_ID, null, null, 50);

            assertEquals(1, results.size());
            assertEquals(DEVICE_ID, results.get(0).deviceId());
            verify(mongoRepository).findByDeviceIdOrderByTimestampDesc(eq(DEVICE_ID), any(PageRequest.class));
            verify(mongoRepository, never()).findHistoryByDeviceIdAndRange(any(), any(), any(), any());
        }
    }

    @Nested
    @DisplayName("findLatest()")
    class FindLatestTests {

        @Test
        @DisplayName("✅ Retorna Optional con registro cuando Mongo encuentra el documento más reciente")
        void findLatest_present() {
            DeviceLocationDocument doc = sampleDocument();

            when(mongoRepository.findFirstByDeviceIdOrderByTimestampDesc(DEVICE_ID))
                .thenReturn(Optional.of(doc));

            Optional<LocationRecordData> result = repositoryAdapter.findLatest(DEVICE_ID);

            assertTrue(result.isPresent());
            assertEquals(DEVICE_ID, result.get().deviceId());
            assertEquals("doc-1", result.get().id());
        }

        @Test
        @DisplayName("✅ Retorna Optional.empty() cuando no existe historial para el dispositivo")
        void findLatest_empty() {
            when(mongoRepository.findFirstByDeviceIdOrderByTimestampDesc("unknown-dev"))
                .thenReturn(Optional.empty());

            Optional<LocationRecordData> result = repositoryAdapter.findLatest("unknown-dev");

            assertTrue(result.isEmpty());
        }
    }
}
