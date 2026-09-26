package dev.crintx.crintx.common.exception;

public enum ResponseCode {
    SUCCESS("SUCCESS", "Operación exitosa"),
    BAD_REQUEST("BAD_REQUEST", "Petición inválida o parámetros incorrectos"),
    RESOURCE_NOT_FOUND("RESOURCE_NOT_FOUND", "Recurso no encontrado"),
    EXTERNAL_SERVICE_ERROR("EXTERNAL_SERVICE_ERROR", "Error al comunicarse con un servicio externo"),
    INTERNAL_SERVER_ERROR("INTERNAL_SERVER_ERROR", "Error interno del servidor");

    private final String code;
    private final String defaultMessage;

    ResponseCode(String code, String defaultMessage) {
        this.code = code;
        this.defaultMessage = defaultMessage;
    }

    public String getCode() {
        return code;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
