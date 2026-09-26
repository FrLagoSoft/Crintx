package dev.crintx.crintx.modules.qr.logic.impl;

import dev.crintx.crintx.modules.qr.command.GenerateQrCommand;
import dev.crintx.crintx.modules.qr.dto.QrResponseDTO;
import dev.crintx.crintx.modules.qr.logic.QrLogic;
import dev.crintx.crintx.modules.qr.mapper.QrMapper;
import dev.crintx.crintx.modules.qr.port.out.QrGeneratorPort;
import dev.crintx.crintx.modules.qr.port.out.QrGeneratorPort.GeneratedQr;
import org.springframework.stereotype.Service;

@Service
public class QrLogicImpl implements QrLogic {

    private final QrGeneratorPort qrGeneratorPort;
    private final QrMapper qrMapper;

    public QrLogicImpl(QrGeneratorPort qrGeneratorPort, QrMapper qrMapper) {
        this.qrGeneratorPort = qrGeneratorPort;
        this.qrMapper = qrMapper;
    }

    @Override
    public QrResponseDTO generateQr(GenerateQrCommand command) {
        // 1. Invocar el puerto de generación de QR
        GeneratedQr generatedQr = qrGeneratorPort.generate(
            command.merchantId(),
            command.amount(),
            command.description(),
            command.referenceId()
        );

        // 2. Mapear y retornar DTO de salida
        return qrMapper.toResponseDTO(command, generatedQr);
    }
}
