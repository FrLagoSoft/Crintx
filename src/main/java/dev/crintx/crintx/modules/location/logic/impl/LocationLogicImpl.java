package dev.crintx.crintx.modules.location.logic.impl;

import dev.crintx.crintx.common.exception.ApiException;
import dev.crintx.crintx.common.exception.ResponseCode;
import dev.crintx.crintx.modules.location.command.GetLocationHistoryCommand;
import dev.crintx.crintx.modules.location.command.TrackLocationCommand;
import dev.crintx.crintx.modules.location.dto.LocationHistoryResponseDTO;
import dev.crintx.crintx.modules.location.dto.LocationPointDTO;
import dev.crintx.crintx.modules.location.logic.LocationLogic;
import dev.crintx.crintx.modules.location.mapper.LocationMapper;
import dev.crintx.crintx.modules.location.port.out.LocationRepositoryPort;
import dev.crintx.crintx.modules.location.port.out.LocationRepositoryPort.LocationRecordData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LocationLogicImpl implements LocationLogic {

    private static final Logger log = LoggerFactory.getLogger(LocationLogicImpl.class);

    private final LocationRepositoryPort repositoryPort;
    private final LocationMapper mapper;

    public LocationLogicImpl(LocationRepositoryPort repositoryPort, LocationMapper mapper) {
        this.repositoryPort = repositoryPort;
        this.mapper = mapper;
    }

    @Override
    public LocationPointDTO trackLocation(TrackLocationCommand command) {
        log.info("Tracking location for deviceId: [{}], lat: {}, lng: {}",
            command.deviceId(), command.latitude(), command.longitude());

        // 1. Mapear command a RecordData
        LocationRecordData recordData = mapper.toRecordData(command);

        // 2. Persistir en MongoDB
        LocationRecordData saved = repositoryPort.save(recordData);

        // 3. Mapear y responder
        return mapper.toPointDTO(saved);
    }

    @Override
    public LocationHistoryResponseDTO getLocationHistory(GetLocationHistoryCommand command) {
        log.info("Fetching location history for deviceId: [{}], limit: {}",
            command.deviceId(), command.limit());

        List<LocationRecordData> records = repositoryPort.findHistory(
            command.deviceId(),
            command.from(),
            command.to(),
            command.limit()
        );

        return mapper.toHistoryDTO(command.deviceId(), records);
    }

    @Override
    public LocationPointDTO getLatestLocation(String deviceId) {
        return repositoryPort.findLatest(deviceId)
            .map(mapper::toPointDTO)
            .orElseThrow(() -> new ApiException(
                ResponseCode.RESOURCE_NOT_FOUND,
                HttpStatus.NOT_FOUND,
                "No se encontró historial de ubicación para el dispositivo: " + deviceId
            ));
    }
}
