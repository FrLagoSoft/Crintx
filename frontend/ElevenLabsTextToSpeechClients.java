//This program will output the text-to-speech voice using the ElevenLabs API

import org.springframework.ai.elevenlabs.ElevenLabsTextToSpeechClient;
import org.springframework.ai.audio.tts.TextToSpeechPrompt;
import org.springframework.ai.audio.tts.TextToSpeechOptions;
import org.springframework.ai.beans.factory.annotation.Autowired;
import org.springframework.ai.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tts")

public class ElevenLabsTextToSpeechClients {
    @Autowired
    private ElevenLabsTextToSpeechClient ttsClient;

    @PostMapping("/generate")
    public byte[] generateSpeech(@RequestParam String text) {
        TextToSpeechOptions options = TextToSpeechOptions.builder()
               .withModel("eleven_multilingual_v2")
               .build();

        TextToSpeechPrompt prompt = new TextToSpeechPrompt.of(text, options);
        return ttsClient.call(prompt).getResult().getOutput();
    }
}