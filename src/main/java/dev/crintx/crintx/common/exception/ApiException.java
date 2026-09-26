package dev.crintx.crintx.common.exception;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
    private final ResponseCode responseCode;
    private final HttpStatus httpStatus;

    public ApiException(ResponseCode responseCode, HttpStatus httpStatus, String message) {
        super(message);
        this.responseCode = responseCode;
        this.httpStatus = httpStatus;
    }

    public ApiException(ResponseCode responseCode, HttpStatus httpStatus) {
        super(responseCode.getDefaultMessage());
        this.responseCode = responseCode;
        this.httpStatus = httpStatus;
    }

    public ResponseCode getResponseCode() {
        return responseCode;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
