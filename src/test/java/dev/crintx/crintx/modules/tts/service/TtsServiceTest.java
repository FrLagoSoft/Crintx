package dev.crintx.crintx.modules.tts.service;

import dev.crintx.crintx.common.exception.ApiException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TtsServiceTest {

    @Mock
    private RestTemplate restTemplate;

    private TtsService ttsService;

    @BeforeEach
    void setUp() {
        ttsService = new TtsService(restTemplate, "elevenlabs", "test-api-key", "EXAVITQu4vr4xnSDxMaL");
    }

    @Test
    void testGenerateSpeechSuccess() {
        byte[] mockAudio = "fake-audio-content".getBytes();
        ResponseEntity<byte[]> responseEntity = new ResponseEntity<>(mockAudio, HttpStatus.OK);

        when(restTemplate.exchange(
            ArgumentMatchers.contains("EXAVITQu4vr4xnSDxMaL"),
            eq(HttpMethod.POST),
            any(HttpEntity.class),
            eq(byte[].class)
        )).thenReturn(responseEntity);

        byte[] result = ttsService.generateSpeech("Hola mundo", null);

        assertNotNull(result);
        assertArrayEquals(mockAudio, result);
    }

    @Test
    void testGenerateSpeechEmptyTextThrowsException() {
        assertThrows(IllegalArgumentException.class, () -> ttsService.generateSpeech("", null));
    }

    @Test
    void testGenerateSpeechMissingApiKeyThrowsException() {
        TtsService noKeyService = new TtsService(restTemplate, "elevenlabs", "", "EXAVITQu4vr4xnSDxMaL");
        assertThrows(ApiException.class, () -> noKeyService.generateSpeech("Hola", null));
    }
}
