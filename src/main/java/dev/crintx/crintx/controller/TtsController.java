package dev.crintx.crintx.controller;

import org.springframework.ai.audio.tts.TextToSpeechModel;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tts")
@ConditionalOnBean(TextToSpeechModel.class)
public class TtsController {

    private final TextToSpeechModel textToSpeechModel;

    public TtsController(TextToSpeechModel textToSpeechModel) {
        this.textToSpeechModel = textToSpeechModel;
    }

    @PostMapping(value = "/generate", produces = "audio/mpeg")
    public byte[] generateSpeech(@RequestParam String text) {
        return textToSpeechModel.call(text);
    }
}