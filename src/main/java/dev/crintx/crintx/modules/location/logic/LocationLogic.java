package dev.crintx.crintx.modules.location.logic;

import dev.crintx.crintx.modules.location.command.GetLocationHistoryCommand;
import dev.crintx.crintx.modules.location.command.TrackLocationCommand;
import dev.crintx.crintx.modules.location.dto.LocationHistoryResponseDTO;
import dev.crintx.crintx.modules.location.dto.LocationPointDTO;

public interface LocationLogic {
    LocationPointDTO trackLocation(TrackLocationCommand command);
    LocationHistoryResponseDTO getLocationHistory(GetLocationHistoryCommand command);
    LocationPointDTO getLatestLocation(String deviceId);
}
