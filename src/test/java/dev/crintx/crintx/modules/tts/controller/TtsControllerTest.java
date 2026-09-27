package dev.crintx.crintx.modules.tts.controller;

import dev.crintx.crintx.modules.tts.service.TtsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TtsController.class)
class TtsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TtsService ttsService;

    @Test
    void testGenerateSpeechEndpoint() throws Exception {
        byte[] mockAudio = "fake-mp3-stream".getBytes();
        when(ttsService.generateSpeech(anyString(), anyString())).thenReturn(mockAudio);

        String jsonPayload = """
            {
                "text": "Alerta de velocidad superada",
                "voiceId": "EXAVITQu4vr4xnSDxMaL"
            }
            """;

        mockMvc.perform(post("/api/tts/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPayload))
            .andExpect(status().isOk())
            .andExpect(header().string("Content-Type", "audio/mpeg"))
            .andExpect(content().bytes(mockAudio));
    }
}
