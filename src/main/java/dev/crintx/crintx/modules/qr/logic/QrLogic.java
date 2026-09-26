package dev.crintx.crintx.modules.qr.logic;

import dev.crintx.crintx.modules.qr.command.GenerateQrCommand;
import dev.crintx.crintx.modules.qr.dto.QrResponseDTO;

public interface QrLogic {
    QrResponseDTO generateQr(GenerateQrCommand command);
}
