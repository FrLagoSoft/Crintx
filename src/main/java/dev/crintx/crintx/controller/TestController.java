package dev.crintx.crintx.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class TestController {

    @GetMapping("/test")
    public Map<String, Object> test() {
        return Map.of(
            "status", "UP",
            "message", "Backend Spring Boot de Crintx funcionando correctamente 🚀",
            "timestamp", LocalDateTime.now()
        );
    }
}
