package dev.crintx.crintx.modules.location.mapper;

import dev.crintx.crintx.modules.location.command.GetLocationHistoryCommand;
import dev.crintx.crintx.modules.location.command.TrackLocationCommand;
import dev.crintx.crintx.modules.location.dto.LocationHistoryResponseDTO;
import dev.crintx.crintx.modules.location.dto.LocationPointDTO;
import dev.crintx.crintx.modules.location.dto.LocationTrackRequestDTO;
import dev.crintx.crintx.modules.location.port.out.LocationRepositoryPort.LocationRecordData;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Component
public class LocationMapper {

    public TrackLocationCommand toTrackCommand(String deviceId, LocationTrackRequestDTO dto) {
        return new TrackLocationCommand(
            deviceId,
            dto.userId(),
            dto.latitude(),
            dto.longitude(),
            dto.speed(),
            dto.accuracy(),
            dto.altitude(),
            dto.batteryLevel(),
            dto.activityType(),
            dto.timestamp() != null ? dto.timestamp() : LocalDateTime.now()
        );
    }

    public GetLocationHistoryCommand toHistoryCommand(String deviceId, LocalDateTime from, LocalDateTime to, Integer limit) {
        return new GetLocationHistoryCommand(
            deviceId,
            from,
            to,
            limit != null ? limit : 50
        );
    }

    public LocationRecordData toRecordData(TrackLocationCommand command) {
        return new LocationRecordData(
            UUID.randomUUID().toString(),
            command.deviceId(),
            command.userId(),
            command.latitude(),
            command.longitude(),
            command.speed(),
            command.accuracy(),
            command.altitude(),
            command.batteryLevel(),
            command.activityType(),
            command.timestamp(),
            LocalDateTime.now()
        );
    }

    public LocationPointDTO toPointDTO(LocationRecordData data) {
        return new LocationPointDTO(
            data.id(),
            data.deviceId(),
            data.userId(),
            data.latitude(),
            data.longitude(),
            data.speed(),
            data.accuracy(),
            data.altitude(),
            data.batteryLevel(),
            data.activityType(),
            data.timestamp(),
            data.recordedAt()
        );
    }

    public LocationHistoryResponseDTO toHistoryDTO(String deviceId, List<LocationRecordData> records) {
        List<LocationPointDTO> points = records.stream()
            .map(this::toPointDTO)
            .toList();

        return new LocationHistoryResponseDTO(deviceId, points.size(), points);
    }
}
