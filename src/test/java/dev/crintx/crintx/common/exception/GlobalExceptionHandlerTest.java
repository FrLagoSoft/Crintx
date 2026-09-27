package dev.crintx.crintx.common.exception;

import dev.crintx.crintx.common.dto.ApiResponseDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("handleApiException() retorna ResponseEntity con código HTTP y estructura ApiResponseDTO")
    void handleApiException_returnsCorrectResponse() {
        ApiException apiEx = new ApiException(ResponseCode.RESOURCE_NOT_FOUND, HttpStatus.NOT_FOUND, "Dispositivo no encontrado");

        ResponseEntity<ApiResponseDTO<Void>> response = exceptionHandler.handleApiException(apiEx);

        assertNotNull(response);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertNotNull(response.getBody());
        assertFalse(response.getBody().success());
        assertEquals("RESOURCE_NOT_FOUND", response.getBody().code());
        assertEquals("Dispositivo no encontrado", response.getBody().message());
    }

    @Test
    @DisplayName("handleMessageNotReadable() retorna 400 Bad Request con mensaje descriptivo")
    void handleMessageNotReadable_returns400() {
        HttpMessageNotReadableException ex = new HttpMessageNotReadableException("JSON malformado", (HttpInputMessage) null);

        ResponseEntity<ApiResponseDTO<Void>> response = exceptionHandler.handleMessageNotReadable(ex);

        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("BAD_REQUEST", response.getBody().code());
        assertEquals("Formato de solicitud JSON inválido", response.getBody().message());
    }

    @Test
    @DisplayName("handleIllegalArgumentException() retorna 400 Bad Request")
    void handleIllegalArgumentException_returns400() {
        IllegalArgumentException ex = new IllegalArgumentException("Parámetro inválido");

        ResponseEntity<ApiResponseDTO<Void>> response = exceptionHandler.handleIllegalArgumentException(ex);

        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Parámetro inválido", response.getBody().message());
    }

    @Test
    @DisplayName("handleMissingHeader() retorna 400 Bad Request especificando el header faltante")
    void handleMissingHeader_returns400() {
        MissingRequestHeaderException ex = new MissingRequestHeaderException("X-Device-Id", null);

        ResponseEntity<ApiResponseDTO<Void>> response = exceptionHandler.handleMissingHeader(ex);

        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().message().contains("X-Device-Id"));
    }

    @Test
    @DisplayName("handleMissingParam() retorna 400 Bad Request especificando el parámetro faltante")
    void handleMissingParam_returns400() {
        MissingServletRequestParameterException ex = new MissingServletRequestParameterException("from", "String");

        ResponseEntity<ApiResponseDTO<Void>> response = exceptionHandler.handleMissingParam(ex);

        assertNotNull(response);
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().message().contains("from"));
    }

    @Test
    @DisplayName("handleGenericException() retorna 500 Internal Server Error sin exponer detalles")
    void handleGenericException_returns500() {
        Exception ex = new RuntimeException("Error inesperado en BD");

        ResponseEntity<ApiResponseDTO<Void>> response = exceptionHandler.handleGenericException(ex);

        assertNotNull(response);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("INTERNAL_SERVER_ERROR", response.getBody().code());
        assertEquals("Ocurrió un error inesperado", response.getBody().message());
    }
}
