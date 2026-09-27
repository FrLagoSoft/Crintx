package dev.crintx.crintx.infrastructure.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "device_locations")
@CompoundIndex(name = "device_timestamp_idx", def = "{'deviceId': 1, 'timestamp': -1}")
public class DeviceLocationDocument {

    @Id
    private String id;

    @Indexed
    private String deviceId;

    @Indexed
    private String userId;

    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private GeoJsonPoint location;

    private Double latitude;
    private Double longitude;

    @Indexed
    private Instant timestamp;

    private Instant recordedAt;

    public DeviceLocationDocument() {}

    public DeviceLocationDocument(
        String id,
        String deviceId,
        String userId,
        Double latitude,
        Double longitude,
        Instant timestamp,
        Instant recordedAt
    ) {
        this.id = id;
        this.deviceId = deviceId;
        this.userId = userId;
        this.latitude = latitude;
        this.longitude = longitude;
        if (longitude != null && latitude != null) {
            this.location = new GeoJsonPoint(longitude, latitude);
        }
        this.timestamp = timestamp;
        this.recordedAt = recordedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public GeoJsonPoint getLocation() {
        return location;
    }

    public void setLocation(GeoJsonPoint location) {
        this.location = location;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public Instant getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(Instant recordedAt) {
        this.recordedAt = recordedAt;
    }
}
