package dev.crintx.crintx.modules.qr.mapper;

import dev.crintx.crintx.modules.qr.command.GenerateQrCommand;
import dev.crintx.crintx.modules.qr.dto.QrRequestDTO;
import dev.crintx.crintx.modules.qr.dto.QrResponseDTO;
import dev.crintx.crintx.modules.qr.port.out.QrGeneratorPort.GeneratedQr;
import org.springframework.stereotype.Component;

@Component
public class QrMapper {

    public GenerateQrCommand toCommand(String merchantId, QrRequestDTO dto) {
        return new GenerateQrCommand(
            merchantId,
            dto.amount(),
            dto.description(),
            dto.referenceId()
        );
    }

    public QrResponseDTO toResponseDTO(GenerateQrCommand command, GeneratedQr generatedQr) {
        return new QrResponseDTO(
            generatedQr.qrId(),
            generatedQr.qrCodeData(),
            generatedQr.qrImageUrl(),
            command.amount(),
            "USD",
            command.referenceId(),
            generatedQr.expiresAt()
        );
    }
}
