package dev.crintx.crintx.controller;

import dev.crintx.crintx.common.exception.ApiException;
import dev.crintx.crintx.common.exception.ResponseCode;
import org.springframework.ai.audio.tts.TextToSpeechModel;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Texto a voz. Si TTS está apagado (sin TTS_PROVIDER / ELEVENLABS_API_KEY),
 * responde 503 en vez de impedir que arranque el servidor.
 */
@RestController
@RequestMapping("/api/tts")
public class TtsController {

    /** Cada carácter consume cuota de ElevenLabs. */
    private static final int MAX_TEXT_LENGTH = 500;

    private final ObjectProvider<TextToSpeechModel> textToSpeechModel;

    public TtsController(ObjectProvider<TextToSpeechModel> textToSpeechModel) {
        this.textToSpeechModel = textToSpeechModel;
    }

    @PostMapping("/generate")
    public ResponseEntity<byte[]> generateSpeech(@RequestParam String text) {
        TextToSpeechModel model = textToSpeechModel.getIfAvailable();
        if (model == null) {
            throw new ApiException(ResponseCode.EXTERNAL_SERVICE_ERROR, HttpStatus.SERVICE_UNAVAILABLE,
                "Texto a voz no está configurado en este servidor");
        }
        if (text.isBlank() || text.length() > MAX_TEXT_LENGTH) {
            throw new IllegalArgumentException("El texto debe tener entre 1 y " + MAX_TEXT_LENGTH + " caracteres");
        }
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType("audio/mpeg"))
            .body(model.call(text));
    }
}
