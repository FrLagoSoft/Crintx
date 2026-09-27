package dev.crintx.crintx.modules.tts.controller;

import dev.crintx.crintx.modules.tts.dto.TtsRequestDTO;
import dev.crintx.crintx.modules.tts.service.TtsService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TtsController {

    private final TtsService ttsService;

    public TtsController(TtsService ttsService) {
        this.ttsService = ttsService;
    }

    @PostMapping(
        value = {"/api/tts/generate", "/api/v1/tts/generate"},
        produces = "audio/mpeg"
    )
    public ResponseEntity<byte[]> generateSpeech(@RequestBody TtsRequestDTO request) {
        byte[] audioData = ttsService.generateSpeech(request.text(), request.voiceId());
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"speech.mp3\"")
            .contentType(MediaType.parseMediaType("audio/mpeg"))
            .body(audioData);
    }
}
