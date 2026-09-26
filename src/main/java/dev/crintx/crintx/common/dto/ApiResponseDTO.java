package dev.crintx.crintx.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponseDTO<T>(
    boolean success,
    String code,
    String message,
    T data,
    LocalDateTime timestamp
) {
    public static <T> ApiResponseDTO<T> ok(T data, String message) {
        return new ApiResponseDTO<>(true, "SUCCESS", message, data, LocalDateTime.now());
    }

    public static <T> ApiResponseDTO<T> ok(T data) {
        return ok(data, "Operación exitosa");
    }

    public static <T> ApiResponseDTO<T> error(String code, String message) {
        return new ApiResponseDTO<>(false, code, message, null, LocalDateTime.now());
    }
}
