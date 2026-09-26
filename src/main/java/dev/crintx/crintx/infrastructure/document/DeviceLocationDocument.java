package dev.crintx.crintx.infrastructure.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

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
    private Double speed;
    private Double accuracy;
    private Double altitude;
    private Integer batteryLevel;
    private String activityType;

    @Indexed
    private LocalDateTime timestamp;

    private LocalDateTime recordedAt;

    public DeviceLocationDocument() {}

    public DeviceLocationDocument(
        String id,
        String deviceId,
        String userId,
        Double latitude,
        Double longitude,
        Double speed,
        Double accuracy,
        Double altitude,
        Integer batteryLevel,
        String activityType,
        LocalDateTime timestamp,
        LocalDateTime recordedAt
    ) {
        this.id = id;
        this.deviceId = deviceId;
        this.userId = userId;
        this.latitude = latitude;
        this.longitude = longitude;
        if (longitude != null && latitude != null) {
            this.location = new GeoJsonPoint(longitude, latitude);
        }
        this.speed = speed;
        this.accuracy = accuracy;
        this.altitude = altitude;
        this.batteryLevel = batteryLevel;
        this.activityType = activityType;
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

    public Double getSpeed() {
        return speed;
    }

    public void setSpeed(Double speed) {
        this.speed = speed;
    }

    public Double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(Double accuracy) {
        this.accuracy = accuracy;
    }

    public Double getAltitude() {
        return altitude;
    }

    public void setAltitude(Double altitude) {
        this.altitude = altitude;
    }

    public Integer getBatteryLevel() {
        return batteryLevel;
    }

    public void setBatteryLevel(Integer batteryLevel) {
        this.batteryLevel = batteryLevel;
    }

    public String getActivityType() {
        return activityType;
    }

    public void setActivityType(String activityType) {
        this.activityType = activityType;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public LocalDateTime getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(LocalDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }
}
