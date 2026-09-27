package dev.crintx.crintx.modules.location.mapper;

import dev.crintx.crintx.modules.location.command.GetLocationHistoryCommand;
import dev.crintx.crintx.modules.location.command.TrackLocationCommand;
import dev.crintx.crintx.modules.location.dto.LocationHistoryResponseDTO;
import dev.crintx.crintx.modules.location.dto.LocationPointDTO;
import dev.crintx.crintx.modules.location.dto.LocationTrackRequestDTO;
import dev.crintx.crintx.modules.location.port.out.LocationRepositoryPort.LocationRecordData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class LocationMapperTest {

    private LocationMapper locationMapper;

    private static final String DEVICE_ID = "dev-100";
    private static final String USER_ID = "user-200";
    private static final Instant NOW = Instant.parse("2026-09-26T12:00:00Z");

    @BeforeEach
    void setUp() {
        locationMapper = new LocationMapper();
    }

    @Test
    @DisplayName("toTrackCommand() mapea correctamente DTO a Command con timestamp dado")
    void toTrackCommand_withTimestamp_mapsCorrectly() {
        LocationTrackRequestDTO dto = new LocationTrackRequestDTO(
            USER_ID, 8.98, -79.51, NOW
        );

        TrackLocationCommand command = locationMapper.toTrackCommand(DEVICE_ID, dto);

        assertNotNull(command);
        assertEquals(DEVICE_ID, command.deviceId());
        assertEquals(USER_ID, command.userId());
        assertEquals(8.98, command.latitude());
        assertEquals(-79.51, command.longitude());
        assertEquals(NOW, command.timestamp());
    }

    @Test
    @DisplayName("toTrackCommand() asigna Instant.now() si timestamp es nulo")
    void toTrackCommand_nullTimestamp_usesCurrentTime() {
        LocationTrackRequestDTO dto = new LocationTrackRequestDTO(
            USER_ID, 8.98, -79.51, null
        );

        TrackLocationCommand command = locationMapper.toTrackCommand(DEVICE_ID, dto);

        assertNotNull(command);
        assertNotNull(command.timestamp());
    }

    @Test
    @DisplayName("toHistoryCommand() mapea rango y límite por defecto")
    void toHistoryCommand_nullLimit_defaultsTo50() {
        Instant from = NOW.minus(1, ChronoUnit.DAYS);
        GetLocationHistoryCommand command = locationMapper.toHistoryCommand(DEVICE_ID, from, NOW, null);

        assertNotNull(command);
        assertEquals(DEVICE_ID, command.deviceId());
        assertEquals(from, command.from());
        assertEquals(NOW, command.to());
        assertEquals(50, command.limit());
    }

    @Test
    @DisplayName("toHistoryCommand() respeta el límite especificado")
    void toHistoryCommand_withLimit_usesCustomLimit() {
        GetLocationHistoryCommand command = locationMapper.toHistoryCommand(DEVICE_ID, null, null, 100);

        assertEquals(100, command.limit());
    }

    @Test
    @DisplayName("toRecordData() mapea Command a LocationRecordData y genera ID")
    void toRecordData_mapsCommandToData() {
        TrackLocationCommand command = new TrackLocationCommand(
            DEVICE_ID, USER_ID, 8.98, -79.51, NOW
        );

        LocationRecordData recordData = locationMapper.toRecordData(command);

        assertNotNull(recordData);
        assertNotNull(recordData.id());
        assertEquals(DEVICE_ID, recordData.deviceId());
        assertEquals(USER_ID, recordData.userId());
        assertEquals(8.98, recordData.latitude());
        assertEquals(-79.51, recordData.longitude());
        assertNotNull(recordData.recordedAt());
    }

    @Test
    @DisplayName("toPointDTO() mapea LocationRecordData a LocationPointDTO")
    void toPointDTO_mapsDataToDTO() {
        LocationRecordData recordData = new LocationRecordData(
            "rec-1", DEVICE_ID, USER_ID, 8.98, -79.51, NOW, NOW.plusSeconds(1)
        );

        LocationPointDTO pointDTO = locationMapper.toPointDTO(recordData);

        assertNotNull(pointDTO);
        assertEquals("rec-1", pointDTO.id());
        assertEquals(DEVICE_ID, pointDTO.deviceId());
        assertEquals(USER_ID, pointDTO.userId());
        assertEquals(8.98, pointDTO.latitude());
        assertEquals(-79.51, pointDTO.longitude());
    }

    @Test
    @DisplayName("toHistoryDTO() mapea lista de LocationRecordData a LocationHistoryResponseDTO")
    void toHistoryDTO_mapsListToHistoryResponse() {
        LocationRecordData rec1 = new LocationRecordData(
            "rec-1", DEVICE_ID, USER_ID, 8.98, -79.51, NOW, NOW
        );
        LocationRecordData rec2 = new LocationRecordData(
            "rec-2", DEVICE_ID, USER_ID, 8.99, -79.52, NOW.plusSeconds(60), NOW.plusSeconds(60)
        );

        LocationHistoryResponseDTO response = locationMapper.toHistoryDTO(DEVICE_ID, List.of(rec1, rec2));

        assertNotNull(response);
        assertEquals(DEVICE_ID, response.deviceId());
        assertEquals(2, response.count());
        assertEquals(2, response.locations().size());
        assertEquals("rec-1", response.locations().get(0).id());
        assertEquals("rec-2", response.locations().get(1).id());
    }
}
