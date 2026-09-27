package dev.crintx.crintx.modules.tts.dto;

public record TtsRequestDTO(
    String text,
    String voiceId
) {}
