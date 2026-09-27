package dev.crintx.crintx.modules.location.controller;

import tools.jackson.databind.ObjectMapper;
import dev.crintx.crintx.common.exception.ApiException;
import dev.crintx.crintx.common.exception.ResponseCode;
import dev.crintx.crintx.modules.location.command.GetLocationHistoryCommand;
import dev.crintx.crintx.modules.location.command.TrackLocationCommand;
import dev.crintx.crintx.modules.location.dto.LocationHistoryResponseDTO;
import dev.crintx.crintx.modules.location.dto.LocationPointDTO;
import dev.crintx.crintx.modules.location.dto.LocationTrackRequestDTO;
import dev.crintx.crintx.modules.location.logic.LocationLogic;
import dev.crintx.crintx.modules.location.mapper.LocationMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LocationController.class)
class LocationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private LocationLogic locationLogic;

    @MockitoBean
    private LocationMapper locationMapper;

    // ========= Datos de prueba reutilizables =========
    private static final String DEVICE_ID = "device-test-001";
    private static final String USER_ID = "user_test";
    private static final Instant NOW = Instant.parse("2026-09-26T14:30:00Z");

    private LocationPointDTO samplePoint() {
        return new LocationPointDTO(
            "id-123", DEVICE_ID, USER_ID,
            8.98238, -79.51973,
            NOW, NOW.plusSeconds(1)
        );
    }

    // ========= POST /api/v1/locations/track =========
    @Nested
    @DisplayName("POST /api/v1/locations/track")
    class TrackLocationTests {

        @Test
        @DisplayName("✅ Registra ubicación correctamente → 201 Created")
        void trackLocation_validRequest_returns201() throws Exception {
            LocationTrackRequestDTO requestDTO = new LocationTrackRequestDTO(
                USER_ID, 8.98238, -79.51973, NOW
            );

            TrackLocationCommand command = new TrackLocationCommand(
                DEVICE_ID, USER_ID, 8.98238, -79.51973, NOW
            );

            when(locationMapper.toTrackCommand(eq(DEVICE_ID), any(LocationTrackRequestDTO.class)))
                .thenReturn(command);
            when(locationLogic.trackLocation(any(TrackLocationCommand.class)))
                .thenReturn(samplePoint());

            mockMvc.perform(post("/api/v1/locations/track")
                    .header("X-Device-Id", DEVICE_ID)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(requestDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.deviceId").value(DEVICE_ID))
                .andExpect(jsonPath("$.data.userId").value(USER_ID))
                .andExpect(jsonPath("$.data.latitude").value(8.98238))
                .andExpect(jsonPath("$.data.longitude").value(-79.51973))
                .andExpect(jsonPath("$.message").value("Ubicación registrada exitosamente"));
        }

        @Test
        @DisplayName("❌ Falta header X-Device-Id → 400 Bad Request")
        void trackLocation_missingDeviceId_returns400() throws Exception {
            LocationTrackRequestDTO requestDTO = new LocationTrackRequestDTO(
                USER_ID, 8.98238, -79.51973, NOW
            );

            mockMvc.perform(post("/api/v1/locations/track")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(requestDTO)))
                .andExpect(status().isBadRequest());
        }
    }

    // ========= GET /api/v1/locations/{deviceId}/history =========
    @Nested
    @DisplayName("GET /api/v1/locations/{deviceId}/history")
    class GetHistoryTests {

        @Test
        @DisplayName("✅ Retorna historial con lista de ubicaciones → 200 OK")
        void getHistory_validDevice_returns200() throws Exception {
            LocationHistoryResponseDTO historyDTO = new LocationHistoryResponseDTO(
                DEVICE_ID, 1, List.of(samplePoint())
            );

            when(locationMapper.toHistoryCommand(eq(DEVICE_ID), isNull(), isNull(), eq(50)))
                .thenReturn(new GetLocationHistoryCommand(DEVICE_ID, null, null, 50));
            when(locationLogic.getLocationHistory(any(GetLocationHistoryCommand.class)))
                .thenReturn(historyDTO);

            mockMvc.perform(get("/api/v1/locations/{deviceId}/history", DEVICE_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.deviceId").value(DEVICE_ID))
                .andExpect(jsonPath("$.data.count").value(1))
                .andExpect(jsonPath("$.data.locations[0].latitude").value(8.98238));
        }

        @Test
        @DisplayName("✅ Retorna historial vacío → 200 OK con count=0")
        void getHistory_noRecords_returns200WithEmpty() throws Exception {
            LocationHistoryResponseDTO emptyHistory = new LocationHistoryResponseDTO(
                DEVICE_ID, 0, List.of()
            );

            when(locationMapper.toHistoryCommand(eq(DEVICE_ID), isNull(), isNull(), eq(50)))
                .thenReturn(new GetLocationHistoryCommand(DEVICE_ID, null, null, 50));
            when(locationLogic.getLocationHistory(any(GetLocationHistoryCommand.class)))
                .thenReturn(emptyHistory);

            mockMvc.perform(get("/api/v1/locations/{deviceId}/history", DEVICE_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.count").value(0))
                .andExpect(jsonPath("$.data.locations").isEmpty());
        }
    }

    // ========= GET /api/v1/locations/{deviceId}/latest =========
    @Nested
    @DisplayName("GET /api/v1/locations/{deviceId}/latest")
    class GetLatestTests {

        @Test
        @DisplayName("✅ Retorna última ubicación conocida → 200 OK")
        void getLatest_existingDevice_returns200() throws Exception {
            when(locationLogic.getLatestLocation(DEVICE_ID)).thenReturn(samplePoint());

            mockMvc.perform(get("/api/v1/locations/{deviceId}/latest", DEVICE_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.deviceId").value(DEVICE_ID))
                .andExpect(jsonPath("$.data.userId").value(USER_ID))
                .andExpect(jsonPath("$.data.latitude").value(8.98238));
        }

        @Test
        @DisplayName("❌ Dispositivo sin historial → 404 Not Found")
        void getLatest_unknownDevice_returns404() throws Exception {
            when(locationLogic.getLatestLocation("device-xyz"))
                .thenThrow(new ApiException(
                    ResponseCode.RESOURCE_NOT_FOUND,
                    HttpStatus.NOT_FOUND,
                    "No se encontró historial de ubicación para el dispositivo: device-xyz"
                ));

            mockMvc.perform(get("/api/v1/locations/{deviceId}/latest", "device-xyz"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
        }
    }
}
