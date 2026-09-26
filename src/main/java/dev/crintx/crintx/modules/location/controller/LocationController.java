package dev.crintx.crintx.modules.location.controller;

import dev.crintx.crintx.common.dto.ApiResponseDTO;
import dev.crintx.crintx.modules.location.command.GetLocationHistoryCommand;
import dev.crintx.crintx.modules.location.command.TrackLocationCommand;
import dev.crintx.crintx.modules.location.dto.LocationHistoryResponseDTO;
import dev.crintx.crintx.modules.location.dto.LocationPointDTO;
import dev.crintx.crintx.modules.location.dto.LocationTrackRequestDTO;
import dev.crintx.crintx.modules.location.logic.LocationLogic;
import dev.crintx.crintx.modules.location.mapper.LocationMapper;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/locations")
public class LocationController {

    private final LocationLogic locationLogic;
    private final LocationMapper locationMapper;

    public LocationController(LocationLogic locationLogic, LocationMapper locationMapper) {
        this.locationLogic = locationLogic;
        this.locationMapper = locationMapper;
    }

    /**
     * Registra un nuevo punto de ubicación GPS emitido por el dispositivo.
     */
    @PostMapping("/track")
    public ResponseEntity<ApiResponseDTO<LocationPointDTO>> trackLocation(
        @RequestHeader("X-Device-Id") String deviceId,
        @RequestBody LocationTrackRequestDTO requestDTO
    ) {
        // 1. Mapear a Command
        TrackLocationCommand command = locationMapper.toTrackCommand(deviceId, requestDTO);

        // 2. Ejecutar lógica
        LocationPointDTO result = locationLogic.trackLocation(command);

        // 3. Respuesta estandarizada
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponseDTO.ok(result, "Ubicación registrada exitosamente"));
    }

    /**
     * Consulta el historial de ubicaciones de un dispositivo específico.
     */
    @GetMapping("/{deviceId}/history")
    public ResponseEntity<ApiResponseDTO<LocationHistoryResponseDTO>> getHistory(
        @PathVariable String deviceId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
        @RequestParam(required = false, defaultValue = "50") Integer limit
    ) {
        // 1. Mapear a Command
        GetLocationHistoryCommand command = locationMapper.toHistoryCommand(deviceId, from, to, limit);

        // 2. Ejecutar lógica
        LocationHistoryResponseDTO history = locationLogic.getLocationHistory(command);

        // 3. Respuesta
        return ResponseEntity.ok(ApiResponseDTO.ok(history, "Historial de ubicaciones obtenido"));
    }

    /**
     * Obtiene la última ubicación conocida de un dispositivo.
     */
    @GetMapping("/{deviceId}/latest")
    public ResponseEntity<ApiResponseDTO<LocationPointDTO>> getLatest(
        @PathVariable String deviceId
    ) {
        LocationPointDTO latest = locationLogic.getLatestLocation(deviceId);
        return ResponseEntity.ok(ApiResponseDTO.ok(latest, "Última ubicación obtenida"));
    }
}
