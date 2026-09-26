package dev.crintx.crintx.modules.qr.controller;

import dev.crintx.crintx.common.dto.ApiResponseDTO;
import dev.crintx.crintx.modules.qr.command.GenerateQrCommand;
import dev.crintx.crintx.modules.qr.dto.QrRequestDTO;
import dev.crintx.crintx.modules.qr.dto.QrResponseDTO;
import dev.crintx.crintx.modules.qr.logic.QrLogic;
import dev.crintx.crintx.modules.qr.mapper.QrMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/qr")
public class QrController {

    private final QrLogic qrLogic;
    private final QrMapper qrMapper;

    public QrController(QrLogic qrLogic, QrMapper qrMapper) {
        this.qrLogic = qrLogic;
        this.qrMapper = qrMapper;
    }

    @PostMapping("/generate")
    public ResponseEntity<ApiResponseDTO<QrResponseDTO>> generateQr(
        @RequestHeader(value = "X-Merchant-Id", defaultValue = "merchant-default-001") String merchantId,
        @RequestBody QrRequestDTO requestDTO
    ) {
        // 1. Mapear a Command
        GenerateQrCommand command = qrMapper.toCommand(merchantId, requestDTO);

        // 2. Ejecutar la lógica
        QrResponseDTO responseDTO = qrLogic.generateQr(command);

        // 3. Responder
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(ApiResponseDTO.ok(responseDTO, "Código QR generado exitosamente"));
    }
}
