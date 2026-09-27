package dev.crintx.crintx.modules.tts.service;

import dev.crintx.crintx.common.exception.ApiException;
import dev.crintx.crintx.common.exception.ResponseCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class TtsService {

    private static final Logger log = LoggerFactory.getLogger(TtsService.class);

    private final RestTemplate restTemplate;
    private final String ttsProvider;
    private final String apiKey;
    private final String defaultVoiceId;

    public TtsService(
        RestTemplate restTemplate,
        @Value("${app.tts.provider:${TTS_PROVIDER:elevenlabs}}") String ttsProvider,
        @Value("${app.tts.elevenlabs.api-key:${ELEVENLABS_API_KEY:}}") String apiKey,
        @Value("${app.tts.elevenlabs.voice-id:${ELEVENLABS_VOICE_ID:EXAVITQu4vr4xnSDxMaL}}") String defaultVoiceId
    ) {
        this.restTemplate = restTemplate;
        this.ttsProvider = ttsProvider;
        this.apiKey = apiKey;
        this.defaultVoiceId = defaultVoiceId;
    }

    public byte[] generateSpeech(String text, String voiceId) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("El texto a sintetizar es obligatorio");
        }

        if (apiKey == null || apiKey.isBlank()) {
            log.error("ElevenLabs API Key no configurada");
            throw new ApiException(ResponseCode.BAD_REQUEST, HttpStatus.UNAUTHORIZED, "La clave de la API de ElevenLabs no está configurada");
        }

        String targetVoiceId = (voiceId != null && !voiceId.isBlank()) ? voiceId : defaultVoiceId;
        String url = "https://api.elevenlabs.io/v1/text-to-speech/" + targetVoiceId;

        log.info("Generando voz con ElevenLabs para voiceId: [{}]", targetVoiceId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("xi-api-key", apiKey.trim());
        headers.set(HttpHeaders.ACCEPT, "audio/mpeg");

        Map<String, Object> body = Map.of(
            "text", text,
            "model_id", "eleven_multilingual_v2",
            "voice_settings", Map.of(
                "stability", 0.5,
                "similarity_boost", 0.75
            )
        );

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                requestEntity,
                byte[].class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Audio generado exitosamente ({} bytes)", response.getBody().length);
                return response.getBody();
            } else {
                throw new ApiException(ResponseCode.EXTERNAL_SERVICE_ERROR, HttpStatus.BAD_GATEWAY, "Respuesta inesperada de ElevenLabs");
            }
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error al comunicarse con ElevenLabs API: {}", e.getMessage());
            throw new ApiException(ResponseCode.EXTERNAL_SERVICE_ERROR, HttpStatus.BAD_GATEWAY, "Error al generar audio en ElevenLabs: " + e.getMessage());
        }
    }
}

